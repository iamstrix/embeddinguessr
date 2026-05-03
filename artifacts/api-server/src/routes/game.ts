import { Router, type IRouter } from "express";
import { eq, desc, count, avg, sum, max, and, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, puzzlesTable, sessionsTable, wordEmbeddingsTable, streaksTable, endlessScoresTable } from "@workspace/db";
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

function sessionShape(s: typeof sessionsTable.$inferSelect, guesses?: unknown[]) {
  return {
    id: s.id,
    puzzleId: s.puzzleId,
    deviceId: s.deviceId,
    guesses: (guesses ?? (s.guesses as unknown[])) ?? [],
    solved: s.solved,
    attemptCount: s.attemptCount,
    playerName: s.playerName ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

/** Resolve a guess word's 3D position. */
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

  const p = projectTo3D(guessVec, getGlobalPcaParams());
  return { x: p.x * COORD_SCALE, y: p.y * COORD_SCALE, z: p.z * COORD_SCALE };
}

/** Update (or create) the streak record for a device after solving a daily puzzle. */
async function updateStreak(deviceId: string, puzzleDate: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  if (puzzleDate !== today) return;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

  const [existing] = await db
    .select()
    .from(streaksTable)
    .where(eq(streaksTable.deviceId, deviceId));

  if (existing) {
    if (existing.lastSolvedDate === today) return;
    const newStreak = existing.lastSolvedDate === yesterday ? existing.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, existing.longestStreak);
    await db
      .update(streaksTable)
      .set({ currentStreak: newStreak, longestStreak: newLongest, lastSolvedDate: today })
      .where(eq(streaksTable.deviceId, deviceId));
  } else {
    await db.insert(streaksTable).values({
      deviceId,
      currentStreak: 1,
      longestStreak: 1,
      lastSolvedDate: today,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Endless puzzle
// ─────────────────────────────────────────────────────────────────────────────

router.post("/game/endless", async (req, res): Promise<void> => {
  if (!isModelReady()) {
    res.status(503).json({ error: "Embedding model is loading, please try again in a moment" });
    return;
  }

  try {
    const puzzle = await generatePuzzle();
    const clues = puzzle.clues as Array<{ word: string; x: number; y: number; z: number }>;
    const embVecs = puzzle.embeddingVectors as Record<string, number[]>;
    const targetVec = embVecs[puzzle.targetWord];

    res.json({
      id: puzzle.id,
      date: puzzle.date,
      clues: clues.map((c) => ({
        ...c,
        isClue: true,
        similarityScore: targetVec && embVecs[c.word] ? cosineSimilarity(embVecs[c.word], targetVec) : undefined,
      })),
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

// ─────────────────────────────────────────────────────────────────────────────
// Endless leaderboard
// ─────────────────────────────────────────────────────────────────────────────

router.get("/game/endless/leaderboard", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      clerkUserId: endlessScoresTable.clerkUserId,
      playerName: sql<string>`(array_agg(${endlessScoresTable.playerName} ORDER BY ${endlessScoresTable.createdAt} DESC))[1]`,
      gamesPlayed: count(),
      totalGuesses: sum(endlessScoresTable.guessCount),
      avgGuesses: avg(endlessScoresTable.guessCount),
      lastPlayedAt: max(endlessScoresTable.createdAt),
    })
    .from(endlessScoresTable)
    .groupBy(endlessScoresTable.clerkUserId)
    .orderBy(avg(endlessScoresTable.guessCount))
    .limit(20);

  const entries = rows.map((r, i) => ({
    rank: i + 1,
    playerName: r.playerName,
    isVerified: true,
    gamesPlayed: Number(r.gamesPlayed),
    totalGuesses: Number(r.totalGuesses ?? 0),
    avgGuesses: parseFloat(Number(r.avgGuesses ?? 0).toFixed(2)),
    lastPlayedAt: r.lastPlayedAt ? r.lastPlayedAt.toISOString() : new Date().toISOString(),
  }));

  res.json(entries);
});

router.post("/game/endless/leaderboard/submit", async (req, res): Promise<void> => {
  const auth = getAuth(req as any);
  const authUserId = auth?.userId;

  const { clerkUserId, playerName, guessCount } = req.body as {
    clerkUserId: string;
    playerName: string;
    guessCount: number;
  };

  if (!authUserId || authUserId !== clerkUserId) {
    res.status(401).json({ error: "Authentication required to submit endless scores" });
    return;
  }

  if (!playerName?.trim() || typeof guessCount !== "number" || guessCount < 1) {
    res.status(400).json({ error: "playerName and guessCount are required" });
    return;
  }

  await db.insert(endlessScoresTable).values({
    clerkUserId: authUserId,
    playerName: playerName.trim().slice(0, 32),
    guessCount,
  });

  // Return the player's updated aggregate stats with rank
  const allRows = await db
    .select({
      clerkUserId: endlessScoresTable.clerkUserId,
      playerName: sql<string>`(array_agg(${endlessScoresTable.playerName} ORDER BY ${endlessScoresTable.createdAt} DESC))[1]`,
      gamesPlayed: count(),
      totalGuesses: sum(endlessScoresTable.guessCount),
      avgGuesses: avg(endlessScoresTable.guessCount),
      lastPlayedAt: max(endlessScoresTable.createdAt),
    })
    .from(endlessScoresTable)
    .groupBy(endlessScoresTable.clerkUserId)
    .orderBy(avg(endlessScoresTable.guessCount));

  const rank = allRows.findIndex((r) => r.clerkUserId === authUserId) + 1;
  const playerRow = allRows.find((r) => r.clerkUserId === authUserId);

  res.json({
    rank,
    playerName: playerRow?.playerName ?? playerName.trim(),
    isVerified: true,
    gamesPlayed: Number(playerRow?.gamesPlayed ?? 1),
    totalGuesses: Number(playerRow?.totalGuesses ?? guessCount),
    avgGuesses: parseFloat(Number(playerRow?.avgGuesses ?? guessCount).toFixed(2)),
    lastPlayedAt: playerRow?.lastPlayedAt?.toISOString() ?? new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Daily puzzle
// ─────────────────────────────────────────────────────────────────────────────

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
  const embVecs = puzzle.embeddingVectors as Record<string, number[]>;
  const targetVec = embVecs[puzzle.targetWord];

  res.json({
    id: puzzle.id,
    date: puzzle.date,
    clues: clues.map((c) => ({
      ...c,
      isClue: true,
      similarityScore: targetVec && embVecs[c.word] ? cosineSimilarity(embVecs[c.word], targetVec) : undefined,
    })),
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

// ─────────────────────────────────────────────────────────────────────────────
// Guess (stateless)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────────────────────────────────────

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
    res.json(sessionShape(existing[0]));
    return;
  }

  const id = randomUUID();
  const [session] = await db
    .insert(sessionsTable)
    .values({ id, puzzleId, deviceId, guesses: [], solved: false, attemptCount: 0 })
    .returning();

  res.json(sessionShape(session, []));
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

  if (isCorrect && !session.solved) {
    updateStreak(session.deviceId, puzzle.date).catch(() => {});
  }

  res.json({
    guess: guessResult,
    session: sessionShape(updatedSession, newGuesses),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Daily leaderboard
// ─────────────────────────────────────────────────────────────────────────────

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
    .limit(20);

  const namedSessions = solvedSessions.filter((s) => s.playerName);

  const entries = namedSessions.map((s, i) => ({
    rank: i + 1,
    playerName: s.playerName ?? "Anonymous",
    isVerified: !!s.clerkUserId,
    attemptCount: s.attemptCount,
    solvedAt: s.updatedAt.toISOString(),
  }));

  res.json(entries);
});

router.post("/game/leaderboard/submit", async (req, res): Promise<void> => {
  const { sessionId, playerName, clerkUserId } = req.body as {
    sessionId: string;
    playerName: string;
    clerkUserId?: string;
  };

  if (!sessionId || !playerName?.trim()) {
    res.status(400).json({ error: "sessionId and playerName are required" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (!session.solved) {
    res.status(400).json({ error: "Session not yet solved" });
    return;
  }

  // Idempotent: if already submitted, return existing entry
  const [puzzle] = await db.select().from(puzzlesTable).where(eq(puzzlesTable.id, session.puzzleId));

  if (session.playerName) {
    const allSolved = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.puzzleId, session.puzzleId), eq(sessionsTable.solved, true)))
      .orderBy(sessionsTable.attemptCount);
    const named = allSolved.filter((s) => s.playerName);
    const rank = named.findIndex((s) => s.id === sessionId) + 1 || 1;
    res.json({
      rank,
      playerName: session.playerName,
      isVerified: !!session.clerkUserId,
      attemptCount: session.attemptCount,
      solvedAt: session.updatedAt.toISOString(),
      alreadySubmitted: true,
    });
    return;
  }

  // Verify Clerk auth if provided
  let verifiedClerkId: string | null = null;
  if (clerkUserId) {
    const auth = getAuth(req as any);
    const authUserId = auth?.userId;
    if (authUserId && authUserId === clerkUserId) {
      verifiedClerkId = authUserId;
    }
  }

  const [updatedSession] = await db
    .update(sessionsTable)
    .set({ playerName: playerName.trim().slice(0, 32), clerkUserId: verifiedClerkId ?? undefined })
    .where(eq(sessionsTable.id, sessionId))
    .returning();

  let rank = 1;
  if (puzzle) {
    const allSolved = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.puzzleId, puzzle.id), eq(sessionsTable.solved, true)))
      .orderBy(sessionsTable.attemptCount);
    const named = allSolved.filter((s) => s.playerName);
    rank = named.findIndex((s) => s.id === sessionId) + 1 || 1;
  }

  res.json({
    rank,
    playerName: updatedSession.playerName ?? playerName,
    isVerified: !!verifiedClerkId,
    attemptCount: updatedSession.attemptCount,
    solvedAt: updatedSession.updatedAt.toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Streak
// ─────────────────────────────────────────────────────────────────────────────

router.get("/game/streak/:deviceId", async (req, res): Promise<void> => {
  const rawDeviceId = Array.isArray(req.params.deviceId)
    ? req.params.deviceId[0]
    : req.params.deviceId;

  if (!rawDeviceId) {
    res.status(400).json({ error: "deviceId is required" });
    return;
  }

  const [streak] = await db
    .select()
    .from(streaksTable)
    .where(eq(streaksTable.deviceId, rawDeviceId));

  res.json({
    deviceId: rawDeviceId,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    lastSolvedDate: streak?.lastSolvedDate ?? null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Power-ups
// ─────────────────────────────────────────────────────────────────────────────

function maskWord(word: string): string {
  const chars = word.split("");
  const result = chars.map((ch, i) => (i === 0 ? ch : Math.random() < 0.5 ? "_" : ch));
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
