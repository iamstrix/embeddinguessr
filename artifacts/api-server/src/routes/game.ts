import { Router, type IRouter } from "express";
import { eq, desc, count, avg, and } from "drizzle-orm";
import { db, puzzlesTable, sessionsTable } from "@workspace/db";
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
} from "../lib/embeddings";
import { randomUUID } from "crypto";

const router: IRouter = Router();

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
  const clues = puzzle.clues as Array<{ word: string; x: number; y: number; z: number }>;

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

  let x: number, y: number, z: number;

  if (isCorrect) {
    x = targetX;
    y = targetY;
    z = targetZ;
  } else {
    let totalWeight = 0;
    x = 0; y = 0; z = 0;
    for (const clue of clues) {
      const clueVec = embeddingVectors[clue.word];
      if (!clueVec) continue;
      const sim = Math.max(0, cosineSimilarity(guessVec, clueVec));
      x += clue.x * sim;
      y += clue.y * sim;
      z += clue.z * sim;
      totalWeight += sim;
    }
    const targetSim = Math.max(0, similarity);
    x += targetX * targetSim;
    y += targetY * targetSim;
    z += targetZ * targetSim;
    totalWeight += targetSim;
    if (totalWeight > 0) {
      x /= totalWeight;
      y /= totalWeight;
      z /= totalWeight;
    }
  }

  const temperature = isCorrect ? "correct" : getTemperature(distance);

  res.json({
    word: cleanWord,
    x,
    y,
    z,
    distanceToTarget: isCorrect ? 0 : distance,
    temperature,
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
  const clues = puzzle.clues as Array<{ word: string; x: number; y: number; z: number }>;

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

  let x: number, y: number, z: number;
  if (isCorrect) {
    x = targetX; y = targetY; z = targetZ;
  } else {
    let totalWeight = 0;
    x = 0; y = 0; z = 0;
    for (const clue of clues) {
      const clueVec = embeddingVectors[clue.word];
      if (!clueVec) continue;
      const sim = Math.max(0, cosineSimilarity(guessVec, clueVec));
      x += clue.x * sim; y += clue.y * sim; z += clue.z * sim;
      totalWeight += sim;
    }
    const targetSim = Math.max(0, similarity);
    x += targetX * targetSim; y += targetY * targetSim; z += targetZ * targetSim;
    totalWeight += targetSim;
    if (totalWeight > 0) { x /= totalWeight; y /= totalWeight; z /= totalWeight; }
  }

  const guessResult = {
    word: cleanWord, x, y, z,
    distanceToTarget: isCorrect ? 0 : distance,
    temperature: isCorrect ? "correct" : getTemperature(distance),
    isCorrect, similarityScore: similarity,
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

export default router;
