import { Router, type IRouter } from "express";
import { eq, desc, count, avg, and } from "drizzle-orm";
import { db, puzzlesTable, sessionsTable, wordEmbeddingsTable } from "@workspace/db";
import {
  SubmitGuessBody,
  CreateSessionBody,
  SubmitSessionGuessParams,
  SubmitSessionGuessBody,
} from "@workspace/api-zod";
import {
  isModelReady,
  getEmbedding,
  cosineSimilarity,
  getTemperature,
  generatePuzzle,
  projectTo3D,
  getGlobalPcaParams,
  COORD_SCALE,
} from "../lib/embeddings";
import { randomUUID } from "crypto";

const router: IRouter = Router();

/** Resolve a guess word's 3D position.
 *  Library words use their pre-computed fixed position (true semantic space).
 *  Unknown words are projected on-the-fly using the same global PCA. */
async function resolvePosition(
  word: string,
  guessVec: number[],
  isCorrect: boolean,
  targetX: number, targetY: number, targetZ: number
): Promise<{ x: number; y: number; z: number }> {
  if (isCorrect) return { x: targetX, y: targetY, z: targetZ };

  const [lib] = await db
    .select({ x: wordEmbeddingsTable.x, y: wordEmbeddingsTable.y, z: wordEmbeddingsTable.z })
    .from(wordEmbeddingsTable)
    .where(eq(wordEmbeddingsTable.word, word))
    .limit(1);

  if (lib) return { x: lib.x, y: lib.y, z: lib.z };

  // Not in library — project on-the-fly into the same global space
  const p = projectTo3D(guessVec, getGlobalPcaParams());
  return { x: p.x * COORD_SCALE, y: p.y * COORD_SCALE, z: p.z * COORD_SCALE };
}

router.post("/game/endless", async (req, res): Promise<void> => {
  if (!isModelReady()) {
    res.status(503).json({ error: "Embedding model is loading, please try again in a moment" });
    return;
  }

  try {
    const puzzle = await generatePuzzle();
    const clues = puzzle.clues as Array<{ word: string; x: number; y: number; z: number }>;

    res.json({
      id: puzzle.id,
      date: puzzle.date,
      clues: clues.map((c) => ({ ...c, isClue: true })),
      target: {
        word: "?",
        x: parseFloat(puzzle.targetX),
        y: parseFloat(puzzle.targetY),
        z: parseFloat(puzzle.targetZ),
        isClue: false,
      },
      modelReady: true,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate endless puzzle");
    res.status(500).json({ error: "Failed to generate puzzle" });
  }
});

router.get("/game/daily", async (req, res): Promise<void> => {
  if (!isModelReady()) {
    res.status(503).json({ error: "Embedding model is loading, please try again in a moment" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const [puzzle] = await db.select().from(puzzlesTable).where(eq(puzzlesTable.date, today));

  if (!puzzle) {
    res.status(503).json({ error: "No puzzle available for today yet" });
    return;
  }

  const clues = puzzle.clues as Array<{ word: string; x: number; y: number; z: number }>;

  res.json({
    id: puzzle.id,
    date: puzzle.date,
    clues: clues.map((c) => ({ ...c, isClue: true })),
    target: {
      word: "?",
      x: parseFloat(puzzle.targetX),
      y: parseFloat(puzzle.targetY),
      z: parseFloat(puzzle.targetZ),
      isClue: false,
    },
    modelReady: true,
  });
});

router.post("/game/guess", async (req, res): Promise<void> => {
  if (!isModelReady()) {
    res.status(400).json({ error: "Embedding model not ready" });
    return;
  }

  const parsed = SubmitGuessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { word, puzzleId } = parsed.data;
  const cleanWord = word.trim().toLowerCase();

  const [puzzle] = await db.select().from(puzzlesTable).where(eq(puzzlesTable.id, puzzleId));
  if (!puzzle) {
    res.status(400).json({ error: "Puzzle not found" });
    return;
  }

  const isCorrect = cleanWord === puzzle.targetWord.toLowerCase();
  const embeddingVectors = puzzle.embeddingVectors as Record<string, number[]>;
  const targetVec = embeddingVectors[puzzle.targetWord];

  let guessVec: number[];
  try {
    guessVec = await getEmbedding(cleanWord);
  } catch {
    res.status(400).json({ error: "Could not compute embedding for this word" });
    return;
  }

  const similarity = cosineSimilarity(guessVec, targetVec);
  const distance = 1 - similarity;

  const targetX = parseFloat(puzzle.targetX);
  const targetY = parseFloat(puzzle.targetY);
  const targetZ = parseFloat(puzzle.targetZ);

  const { x, y, z } = await resolvePosition(cleanWord, guessVec, isCorrect, targetX, targetY, targetZ);

  res.json({
    word: cleanWord,
    x, y, z,
    distanceToTarget: isCorrect ? 0 : distance,
    temperature: isCorrect ? "correct" : getTemperature(distance),
    isCorrect,
    similarityScore: similarity,
  });
});

router.post("/game/session", async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { deviceId, puzzleId } = parsed.data;

  const existing = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.deviceId, deviceId), eq(sessionsTable.puzzleId, puzzleId)));

  if (existing.length > 0) {
    const s = existing[0];
    res.json({
      id: s.id,
      puzzleId: s.puzzleId,
      deviceId: s.deviceId,
      guesses: (s.guesses as unknown[]) ?? [],
      solved: s.solved,
      attemptCount: s.attemptCount,
      createdAt: s.createdAt.toISOString(),
    });
    return;
  }

  const id = randomUUID();
  const [session] = await db
    .insert(sessionsTable)
    .values({ id, puzzleId, deviceId, guesses: [], solved: false, attemptCount: 0 })
    .returning();

  res.json({
    id: session.id,
    puzzleId: session.puzzleId,
    deviceId: session.deviceId,
    guesses: [],
    solved: false,
    attemptCount: 0,
    createdAt: session.createdAt.toISOString(),
  });
});

router.post("/game/session/:sessionId/submit", async (req, res): Promise<void> => {
  if (!isModelReady()) {
    res.status(400).json({ error: "Embedding model not ready" });
    return;
  }

  const rawId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const params = SubmitSessionGuessParams.safeParse({ sessionId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SubmitSessionGuessBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, rawId));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const [puzzle] = await db.select().from(puzzlesTable).where(eq(puzzlesTable.id, session.puzzleId));
  if (!puzzle) {
    res.status(400).json({ error: "Puzzle not found" });
    return;
  }

  const cleanWord = body.data.word.trim().toLowerCase();
  const isCorrect = cleanWord === puzzle.targetWord.toLowerCase();

  const embeddingVectors = puzzle.embeddingVectors as Record<string, number[]>;
  const targetVec = embeddingVectors[puzzle.targetWord];

  let guessVec: number[];
  try {
    guessVec = await getEmbedding(cleanWord);
  } catch {
    res.status(400).json({ error: "Could not compute embedding for this word" });
    return;
  }

  const similarity = cosineSimilarity(guessVec, targetVec);
  const distance = 1 - similarity;

  const targetX = parseFloat(puzzle.targetX);
  const targetY = parseFloat(puzzle.targetY);
  const targetZ = parseFloat(puzzle.targetZ);

  const { x, y, z } = await resolvePosition(cleanWord, guessVec, isCorrect, targetX, targetY, targetZ);

  const guessResult = {
    word: cleanWord, x, y, z,
    distanceToTarget: isCorrect ? 0 : distance,
    temperature: isCorrect ? "correct" : getTemperature(distance),
    isCorrect,
    similarityScore: similarity,
  };

  const currentGuesses = (session.guesses as unknown[]) ?? [];
  const newGuesses = [...currentGuesses, guessResult];
  const newAttempts = session.attemptCount + 1;

  const [updatedSession] = await db
    .update(sessionsTable)
    .set({ guesses: newGuesses, solved: isCorrect, attemptCount: newAttempts })
    .where(eq(sessionsTable.id, rawId))
    .returning();

  res.json({
    guess: guessResult,
    session: {
      id: updatedSession.id,
      puzzleId: updatedSession.puzzleId,
      deviceId: updatedSession.deviceId,
      guesses: newGuesses,
      solved: updatedSession.solved,
      attemptCount: updatedSession.attemptCount,
      createdAt: updatedSession.createdAt.toISOString(),
    },
  });
});

router.get("/game/leaderboard", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const [puzzle] = await db.select().from(puzzlesTable).where(eq(puzzlesTable.date, today));

  if (!puzzle) {
    res.json([]);
    return;
  }

  const solvedSessions = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.puzzleId, puzzle.id), eq(sessionsTable.solved, true)))
    .orderBy(sessionsTable.attemptCount)
    .limit(10);

  const entries = solvedSessions.map((s, i) => ({
    rank: i + 1,
    deviceId: s.deviceId.slice(0, 8) + "...",
    attemptCount: s.attemptCount,
    solvedAt: s.updatedAt.toISOString(),
  }));

  res.json(entries);
});

router.get("/game/stats", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const [puzzle] = await db.select().from(puzzlesTable).where(eq(puzzlesTable.date, today));

  if (!puzzle) {
    res.json({ totalPlayers: 0, solvedCount: 0, averageGuesses: 0, solveRate: 0, puzzleDate: today });
    return;
  }

  const [totals] = await db
    .select({ total: count() })
    .from(sessionsTable)
    .where(eq(sessionsTable.puzzleId, puzzle.id));

  const [solved] = await db
    .select({ solvedTotal: count(), avgGuesses: avg(sessionsTable.attemptCount) })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.puzzleId, puzzle.id), eq(sessionsTable.solved, true)));

  const totalPlayers = Number(totals?.total ?? 0);
  const solvedCount = Number(solved?.solvedTotal ?? 0);
  const averageGuesses = parseFloat(String(solved?.avgGuesses ?? 0)) || 0;

  res.json({
    totalPlayers,
    solvedCount,
    averageGuesses,
    solveRate: totalPlayers > 0 ? solvedCount / totalPlayers : 0,
    puzzleDate: today,
  });
});

function maskWord(word: string): string {
  const chars = word.split("");
  // Always reveal the first letter. Randomly hide ~50% of the rest.
  // Guarantee at least one hidden letter and at least one revealed beyond the first.
  const result = chars.map((ch, i) => (i === 0 ? ch : Math.random() < 0.5 ? "_" : ch));
  // If every letter after the first is revealed, hide a random middle one
  const hiddenCount = result.filter((c) => c === "_").length;
  if (hiddenCount === 0 && word.length > 1) {
    const idx = 1 + Math.floor(Math.random() * (word.length - 1));
    result[idx] = "_";
  }
  return result.join("");
}

router.post("/game/black-hole", async (req, res): Promise<void> => {
  const { puzzleId } = req.body as { puzzleId: number };

  const [puzzle] = await db.select().from(puzzlesTable).where(eq(puzzlesTable.id, puzzleId));
  if (!puzzle) { res.status(404).json({ error: "Puzzle not found" }); return; }

  const [targetEmb] = await db
    .select()
    .from(wordEmbeddingsTable)
    .where(eq(wordEmbeddingsTable.word, puzzle.targetWord))
    .limit(1);
  if (!targetEmb) { res.status(500).json({ error: "Target not in library" }); return; }

  res.json({ word: maskWord(puzzle.targetWord), x: targetEmb.x, y: targetEmb.y, z: targetEmb.z });
});

router.post("/game/hint", async (req, res): Promise<void> => {
  const { puzzleId, excludeWords = [] } = req.body as { puzzleId: number; excludeWords: string[] };

  const [puzzle] = await db.select().from(puzzlesTable).where(eq(puzzlesTable.id, puzzleId));
  if (!puzzle) {
    res.status(404).json({ error: "Puzzle not found" });
    return;
  }

  const [targetEmb] = await db
    .select()
    .from(wordEmbeddingsTable)
    .where(eq(wordEmbeddingsTable.word, puzzle.targetWord))
    .limit(1);

  if (!targetEmb) {
    res.status(500).json({ error: "Target word not in library" });
    return;
  }

  const targetVec = targetEmb.embedding as number[];
  const clueWords = (puzzle.clues as Array<{ word: string }>).map((c) => c.word);
  const excludeSet = new Set([...excludeWords, ...clueWords, puzzle.targetWord]);

  const allWords = await db.select().from(wordEmbeddingsTable);

  const scored = allWords
    .filter((w) => !excludeSet.has(w.word))
    .map((w) => ({
      word: w.word,
      x: w.x,
      y: w.y,
      z: w.z,
      similarity: cosineSimilarity(w.embedding as number[], targetVec),
    }))
    .filter((w) => w.similarity >= 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  res.json({ hints: scored });
});

export default router;
