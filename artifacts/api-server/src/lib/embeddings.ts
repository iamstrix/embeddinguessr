import { logger } from "./logger";

type EmbeddingFunction = (texts: string[], options?: { pooling: string; normalize: boolean }) => Promise<{ tolist: () => number[][] }>;

let pipeline: ((task: string, model: string) => Promise<EmbeddingFunction>) | null = null;
let embeddingPipeline: EmbeddingFunction | null = null;
let modelReady = false;
let modelLoading = false;

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
    await initializeDailyPuzzle();
  } catch (err) {
    logger.error({ err }, "Failed to load embedding model");
    modelLoading = false;
  }
}

export function isModelReady() {
  return modelReady;
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
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function reduceTo3D(
  vectors: number[][],
  labels: string[]
): Array<{ word: string; x: number; y: number; z: number }> {
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
    let vec = initVec ?? Array.from({ length: dim }, () => Math.random() - 0.5);
    for (let iter = 0; iter < 100; iter++) {
      const newVec = new Array(dim).fill(0);
      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
          newVec[i] += matrix[i][j] * vec[j];
        }
      }
      const norm = Math.sqrt(newVec.reduce((s, x) => s + x * x, 0));
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
  const pc2 = powerIteration(cov2, pc1.map((x) => -x + 0.1));
  const cov3 = deflate(cov2, pc2);
  const pc3 = powerIteration(cov3, pc2.map((x) => x + 0.1));

  const project = (v: number[], pc: number[]) =>
    v.reduce((s, val, i) => s + val * pc[i], 0);

  const coords = centered.map((v) => ({
    x: project(v, pc1),
    y: project(v, pc2),
    z: project(v, pc3),
  }));

  const scale = (vals: number[]) => {
    const max = Math.max(...vals.map(Math.abs)) || 1;
    return vals.map((v) => v / max);
  };

  const xs = scale(coords.map((c) => c.x));
  const ys = scale(coords.map((c) => c.y));
  const zs = scale(coords.map((c) => c.z));

  return labels.map((word, i) => ({ word, x: xs[i], y: ys[i], z: zs[i] }));
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

  const allWords = [...puzzleSet.clues, puzzleSet.target];
  const vectors = await getEmbeddings(allWords);
  const points = reduceTo3D(vectors, allWords);

  const clues = puzzleSet.clues.map((word) => {
    const pt = points.find((p) => p.word === word)!;
    return { word: pt.word, x: pt.x, y: pt.y, z: pt.z };
  });
  const targetPt = points.find((p) => p.word === puzzleSet.target)!;
  const embeddingVectors: Record<string, number[]> = {};
  allWords.forEach((w, i) => { embeddingVectors[w] = vectors[i]; });

  const [puzzle] = await db.insert(puzzlesTable).values({
    date: date ?? new Date().toISOString(),
    targetWord: puzzleSet.target,
    targetX: String(targetPt.x),
    targetY: String(targetPt.y),
    targetZ: String(targetPt.z),
    clues,
    embeddingVectors,
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
