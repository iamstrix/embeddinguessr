import { logger } from "./logger";

type EmbeddingFunction = (texts: string[], options?: { pooling: string; normalize: boolean }) => Promise<{ tolist: () => number[][] }>;

let pipeline: ((task: string, model: string) => Promise<EmbeddingFunction>) | null = null;
let embeddingPipeline: EmbeddingFunction | null = null;
let modelReady = false;
let modelLoading = false;
let globalPcaParams: PcaParams | null = null;

async function loadPipeline() {
  if (modelLoading || modelReady) return;
  modelLoading = true;
  try {
    const transformers = await import("@xenova/transformers");
    pipeline = transformers.pipeline as unknown as (task: string, model: string) => Promise<EmbeddingFunction>;
    logger.info("Loading embedding model...");
    embeddingPipeline = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    modelReady = true;
    logger.info("Embedding model ready");
    await computeGlobalPca();
    await initializeDailyPuzzle();
  } catch (err) {
    logger.error({ err }, "Failed to load embedding model");
    modelLoading = false;
  }
}

export function isModelReady() {
  return modelReady;
}

export function getGlobalPcaParams(): PcaParams {
  if (!globalPcaParams) throw new Error("Global PCA not ready");
  return globalPcaParams;
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (!embeddingPipeline) throw new Error("Embedding model not ready");
  const output = await embeddingPipeline([text], { pooling: "mean", normalize: true });
  return output.tolist()[0];
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!embeddingPipeline) throw new Error("Embedding model not ready");
  const output = await embeddingPipeline(texts, { pooling: "mean", normalize: true });
  return output.tolist();
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface PcaParams {
  mean: number[];
  pc1: number[];
  pc2: number[];
  pc3: number[];
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

function computePcaFromVectors(vectors: number[][]): PcaParams {
  const n = vectors.length;
  const dim = vectors[0].length;

  const mean = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) mean[i] += v[i] / n;
  }

  const centered = vectors.map((v) => v.map((val, i) => val - mean[i]));

  const cov = Array.from({ length: dim }, () => new Array(dim).fill(0));
  for (const v of centered) {
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        cov[i][j] += (v[i] * v[j]) / n;
      }
    }
  }

  const powerIteration = (matrix: number[][], initVec?: number[]): number[] => {
    let vec = initVec ?? Array.from({ length: dim }, (_, i) => (i % 3 === 0 ? 1 : -1) * 0.5);
    for (let iter = 0; iter < 200; iter++) {
      const newVec = new Array(dim).fill(0);
      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
          newVec[i] += matrix[i][j] * vec[j];
        }
      }
      const norm = Math.sqrt(newVec.reduce((s, x) => s + x * x, 0));
      if (norm === 0) break;
      vec = newVec.map((x) => x / norm);
    }
    return vec;
  };

  const deflate = (matrix: number[][], vec: number[]): number[][] => {
    const eigenVal = vec.reduce(
      (s, v, i) => s + matrix[i].reduce((ss, m, j) => ss + m * vec[j], 0) * v,
      0
    );
    return matrix.map((row, i) =>
      row.map((val, j) => val - eigenVal * vec[i] * vec[j])
    );
  };

  const pc1 = powerIteration(cov);
  const cov2 = deflate(cov, pc1);
  const pc2 = powerIteration(cov2, pc1.map((x) => -x));
  const cov3 = deflate(cov2, pc2);
  const pc3 = powerIteration(cov3, pc2.map((x) => -x));

  const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
  const rawCoords = centered.map((v) => ({
    x: dot(v, pc1),
    y: dot(v, pc2),
    z: dot(v, pc3),
  }));

  const scaleX = Math.max(...rawCoords.map((c) => Math.abs(c.x))) || 1;
  const scaleY = Math.max(...rawCoords.map((c) => Math.abs(c.y))) || 1;
  const scaleZ = Math.max(...rawCoords.map((c) => Math.abs(c.z))) || 1;

  return { mean, pc1, pc2, pc3, scaleX, scaleY, scaleZ };
}

export function projectTo3D(vec: number[], pcaParams: PcaParams): { x: number; y: number; z: number } {
  const { mean, pc1, pc2, pc3, scaleX, scaleY, scaleZ } = pcaParams;
  const centered = vec.map((v, i) => v - mean[i]);
  const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
  return {
    x: dot(centered, pc1) / scaleX,
    y: dot(centered, pc2) / scaleY,
    z: dot(centered, pc3) / scaleZ,
  };
}

// Large, diverse reference vocabulary so PCA axes capture the full
// shape of semantic space — not just the 4 puzzle words.
const REFERENCE_VOCABULARY = [
  // Nature & elements
  "tree", "water", "fire", "earth", "sky", "mountain", "ocean", "river", "forest",
  "desert", "cloud", "rain", "wind", "snow", "sun", "moon", "flower", "grass", "stone", "cave",
  // Animals
  "dog", "cat", "bird", "fish", "horse", "lion", "whale", "snake", "elephant", "wolf",
  "eagle", "dolphin", "tiger", "rabbit", "bear", "spider", "shark", "butterfly", "cow", "fox",
  // Human & social
  "love", "war", "peace", "family", "friend", "king", "queen", "child", "soldier", "teacher",
  "doctor", "artist", "hero", "villain", "leader", "mother", "father", "servant", "hunter", "merchant",
  // Emotions & abstract
  "happy", "sad", "angry", "afraid", "joy", "grief", "hope", "dream", "memory", "truth",
  "freedom", "justice", "power", "beauty", "wisdom", "chaos", "order", "mystery", "silence", "darkness",
  // Science & technology
  "atom", "energy", "computer", "light", "gravity", "chemistry", "virus", "robot", "electricity", "medicine",
  "telescope", "rocket", "engine", "bridge", "weapon", "tool", "clock", "map", "ship", "wheel",
  // Arts & culture
  "music", "painting", "poetry", "cinema", "dance", "theater", "sculpture", "novel", "song", "rhythm",
  "color", "canvas", "instrument", "camera", "keyboard", "library", "stage", "broadcast", "festival", "monument",
  // Food & agriculture
  "bread", "sugar", "salt", "fruit", "meat", "wine", "coffee", "honey", "chocolate", "rice",
  "wheat", "corn", "apple", "milk", "butter", "vegetable", "spice", "feast", "hunger", "harvest",
  // Sports & activity
  "running", "swimming", "football", "tennis", "climbing", "hunting", "fishing", "boxing", "archery", "race",
  // Space & cosmos
  "star", "galaxy", "planet", "universe", "infinity", "comet", "asteroid", "black hole", "nebula", "orbit",
  // Materials & objects
  "gold", "iron", "wood", "glass", "diamond", "silk", "sand", "ice", "smoke", "shadow",
  "crown", "sword", "shield", "ring", "mirror", "lantern", "coin", "throne", "gate", "tower",
];

async function computeGlobalPca() {
  logger.info(`Computing global PCA on ${REFERENCE_VOCABULARY.length} reference words...`);
  const vectors = await getEmbeddings(REFERENCE_VOCABULARY);
  globalPcaParams = computePcaFromVectors(vectors);
  logger.info("Global PCA ready");
}

export function getTemperature(distance: number): "freezing" | "cold" | "cool" | "warm" | "hot" | "correct" {
  if (distance === 0) return "correct";
  if (distance < 0.15) return "hot";
  if (distance < 0.3) return "warm";
  if (distance < 0.5) return "cool";
  if (distance < 0.7) return "cold";
  return "freezing";
}

const PUZZLE_SETS: Array<{ target: string; clues: string[] }> = [
  { target: "tree", clues: ["apple", "dirt", "forest"] },
  { target: "ocean", clues: ["fish", "sand", "wave"] },
  { target: "fire", clues: ["smoke", "ice", "candle"] },
  { target: "music", clues: ["silence", "dance", "emotion"] },
  { target: "bread", clues: ["butter", "grain", "hunger"] },
  { target: "moon", clues: ["tide", "night", "rocket"] },
  { target: "gold", clues: ["mine", "crown", "value"] },
  { target: "storm", clues: ["calm", "lightning", "shelter"] },
  { target: "river", clues: ["mountain", "sea", "boat"] },
  { target: "dream", clues: ["sleep", "reality", "wish"] },
  { target: "diamond", clues: ["coal", "ring", "hardness"] },
  { target: "shadow", clues: ["light", "darkness", "form"] },
  { target: "honey", clues: ["flower", "bee", "sweetness"] },
  { target: "star", clues: ["night", "galaxy", "wish"] },
  { target: "sword", clues: ["shield", "war", "knight"] },
];

export async function generatePuzzle(puzzleSet: { target: string; clues: string[] }, date?: string) {
  const { db, puzzlesTable } = await import("@workspace/db");
  const pca = getGlobalPcaParams();

  const allWords = [...puzzleSet.clues, puzzleSet.target];
  const vectors = await getEmbeddings(allWords);

  const embeddingVectors: Record<string, number[]> = {};
  allWords.forEach((w, i) => { embeddingVectors[w] = vectors[i]; });

  // Project every word through the global PCA
  const points = allWords.map((word, i) => ({
    word,
    ...projectTo3D(vectors[i], pca),
  }));

  const clues = puzzleSet.clues.map((word) => {
    const pt = points.find((p) => p.word === word)!;
    return { word: pt.word, x: pt.x, y: pt.y, z: pt.z };
  });
  const targetPt = points.find((p) => p.word === puzzleSet.target)!;

  const [puzzle] = await db.insert(puzzlesTable).values({
    date: date ?? new Date().toISOString(),
    targetWord: puzzleSet.target,
    targetX: String(targetPt.x),
    targetY: String(targetPt.y),
    targetZ: String(targetPt.z),
    clues,
    embeddingVectors,
    pcaParams: pca,
  }).returning();

  return puzzle;
}

export function getRandomPuzzleSet() {
  return PUZZLE_SETS[Math.floor(Math.random() * PUZZLE_SETS.length)];
}

async function initializeDailyPuzzle() {
  const { db, puzzlesTable } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");

  const today = new Date().toISOString().split("T")[0];
  const existing = await db.select().from(puzzlesTable).where(eq(puzzlesTable.date, today));
  if (existing.length > 0) {
    logger.info({ date: today }, "Puzzle already exists for today");
    return;
  }

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const puzzleSet = PUZZLE_SETS[dayOfYear % PUZZLE_SETS.length];
  await generatePuzzle(puzzleSet, today);
  logger.info({ date: today, target: puzzleSet.target }, "Daily puzzle created");
}

loadPipeline().catch((err) => logger.error({ err }, "Pipeline init error"));
