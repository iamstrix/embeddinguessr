import { logger } from "./logger";
import { sql } from "drizzle-orm";

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
    await seedWordLibrary();
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

// All stored coordinates are multiplied by this factor to spread the space.
export const COORD_SCALE = 5;

// Reference vocabulary for PCA — diverse enough to orient the axes meaningfully.
const REFERENCE_VOCABULARY = [
  "tree", "water", "fire", "earth", "sky", "mountain", "ocean", "river", "forest",
  "desert", "cloud", "rain", "wind", "snow", "sun", "moon", "flower", "grass", "stone", "cave",
  "dog", "cat", "bird", "fish", "horse", "lion", "whale", "snake", "elephant", "wolf",
  "eagle", "dolphin", "tiger", "rabbit", "bear", "spider", "shark", "butterfly", "cow", "fox",
  "love", "war", "peace", "family", "friend", "king", "queen", "child", "soldier", "teacher",
  "doctor", "artist", "hero", "villain", "leader", "mother", "father", "servant", "hunter", "merchant",
  "happy", "sad", "angry", "afraid", "joy", "grief", "hope", "dream", "memory", "truth",
  "freedom", "justice", "power", "beauty", "wisdom", "chaos", "order", "mystery", "silence", "darkness",
  "atom", "energy", "computer", "light", "gravity", "chemistry", "virus", "robot", "electricity", "medicine",
  "telescope", "rocket", "engine", "bridge", "weapon", "tool", "clock", "map", "ship", "wheel",
  "music", "painting", "poetry", "cinema", "dance", "theater", "sculpture", "novel", "song", "rhythm",
  "color", "canvas", "instrument", "camera", "keyboard", "library", "stage", "broadcast", "festival", "monument",
  "bread", "sugar", "salt", "fruit", "meat", "wine", "coffee", "honey", "chocolate", "rice",
  "wheat", "corn", "apple", "milk", "butter", "vegetable", "spice", "feast", "hunger", "harvest",
  "running", "swimming", "football", "tennis", "climbing", "hunting", "fishing", "boxing", "archery", "race",
  "star", "galaxy", "planet", "universe", "infinity", "comet", "asteroid", "nebula", "orbit",
  "gold", "iron", "wood", "glass", "diamond", "silk", "sand", "ice", "smoke", "shadow",
  "crown", "sword", "shield", "ring", "mirror", "lantern", "coin", "throne", "gate", "tower",
];

// The full word library — pre-embedded at startup and stored in the DB.
// All guesses on library words use their fixed position in this shared space.
export const WORD_LIBRARY: string[] = [
  // Animals
  "ant", "ape", "bat", "bear", "bee", "bird", "bull", "butterfly", "cat", "cobra",
  "crab", "crane", "crow", "deer", "dolphin", "dove", "dragon", "duck", "eagle", "elephant",
  "falcon", "fish", "flamingo", "fly", "fox", "frog", "giraffe", "goat", "gorilla", "hawk",
  "horse", "hound", "jellyfish", "kangaroo", "kitten", "lamb", "leopard", "lion", "lobster", "lynx",
  "monkey", "moth", "mouse", "octopus", "owl", "panda", "parrot", "penguin", "pig", "pigeon",
  "rabbit", "raven", "salmon", "seal", "shark", "sheep", "shrimp", "snake", "spider", "squid",
  "swan", "tiger", "toad", "tortoise", "turtle", "vulture", "whale", "wolf", "worm", "zebra",
  // Nature
  "avalanche", "beach", "boulder", "branch", "canyon", "cave", "cliff", "cloud", "coast", "coral",
  "creek", "crystal", "desert", "dew", "dune", "earthquake", "eclipse", "fern", "field", "fjord",
  "flood", "fog", "forest", "geyser", "glacier", "gorge", "grass", "grove", "hail", "hill",
  "horizon", "hurricane", "island", "jungle", "lake", "leaf", "lightning", "marsh", "meadow", "meteor",
  "mist", "moon", "mountain", "mud", "oasis", "ocean", "petal", "plain", "plateau", "pond",
  "puddle", "rain", "rainbow", "reef", "river", "rock", "root", "sand", "savanna", "seed",
  "shadow", "shell", "shore", "sky", "sleet", "snow", "soil", "spring", "star", "stone",
  "stream", "swamp", "tide", "tornado", "tsunami", "tundra", "valley", "vine", "volcano", "waterfall",
  "wave", "wilderness", "wind",
  // Food & drink
  "apple", "avocado", "bacon", "banana", "bean", "berry", "biscuit", "bread", "broth", "butter",
  "cake", "candy", "carrot", "cereal", "cheese", "cherry", "chicken", "chocolate", "cider", "coffee",
  "cookie", "corn", "cream", "cucumber", "curry", "egg", "fudge", "garlic", "grape", "herb",
  "honey", "ice", "jam", "juice", "lemon", "lime", "mango", "milk", "mint", "mushroom",
  "noodle", "nut", "oat", "olive", "onion", "orange", "pasta", "peach", "pear", "pepper",
  "pie", "pizza", "plum", "potato", "pretzel", "pudding", "pumpkin", "raisin", "rice", "salad",
  "salmon", "salt", "sauce", "soup", "steak", "strawberry", "sugar", "sushi", "syrup", "tea",
  "toast", "tomato", "tuna", "vinegar", "walnut", "wheat", "wine", "yogurt",
  // People & society
  "adult", "ancestor", "artist", "athlete", "banker", "boss", "brother", "citizen", "dancer", "daughter",
  "doctor", "elder", "enemy", "explorer", "farmer", "father", "friend", "general", "ghost", "grandfather",
  "grandmother", "guard", "guide", "hero", "hunter", "judge", "king", "knight", "lawyer", "leader",
  "merchant", "minister", "monk", "mother", "neighbor", "nurse", "orphan", "parent", "peasant", "pilgrim",
  "pioneer", "poet", "prince", "princess", "prisoner", "prophet", "queen", "rebel", "refugee", "rider",
  "sailor", "saint", "scholar", "shepherd", "sister", "soldier", "son", "spy", "stranger", "student",
  "teacher", "thief", "warrior", "widow", "witch", "wizard", "worker",
  // Emotions & abstract
  "ambition", "anger", "anxiety", "boredom", "chaos", "comfort", "courage", "curiosity", "desire", "dream",
  "duty", "empathy", "envy", "faith", "fame", "fear", "freedom", "glory", "grief", "guilt",
  "happiness", "harmony", "hatred", "hope", "horror", "humility", "imagination", "jealousy", "joy", "justice",
  "kindness", "knowledge", "loneliness", "love", "loyalty", "luck", "mercy", "mystery", "nostalgia", "order",
  "passion", "patience", "peace", "pleasure", "power", "pride", "purpose", "rage", "regret", "relief",
  "sadness", "shame", "silence", "sorrow", "strength", "success", "surprise", "terror", "trust", "truth",
  "victory", "virtue", "wisdom", "wonder", "worry",
  // Objects & tools
  "anchor", "anvil", "axe", "badge", "barrel", "basket", "battery", "bell", "belt", "blade",
  "bomb", "book", "bottle", "bow", "bridge", "bullet", "camera", "candle", "cannon", "chain",
  "chest", "clock", "coin", "compass", "crown", "curtain", "dagger", "diary", "drum", "engine",
  "envelope", "flag", "flame", "flask", "gate", "gem", "glass", "globe", "hammer", "hook",
  "jar", "key", "knife", "lamp", "lantern", "laser", "lens", "lock", "magnet", "map",
  "mask", "medal", "mirror", "needle", "net", "paddle", "paper", "pen", "pipe", "plank",
  "potion", "prism", "pump", "rope", "ruler", "sail", "scissors", "shield", "signal", "socket",
  "spear", "staff", "sword", "telescope", "torch", "tower", "trap", "umbrella", "vault", "vial",
  "wall", "wheel", "whip", "wire",
  // Places & buildings
  "airport", "arena", "barn", "basement", "castle", "cathedral", "cemetery", "city", "classroom", "cottage",
  "court", "dungeon", "factory", "farm", "fortress", "garden", "harbor", "hospital", "hotel", "hut",
  "kingdom", "laboratory", "library", "lighthouse", "market", "maze", "mine", "monastery", "museum", "palace",
  "park", "pier", "plantation", "prison", "pyramid", "ruins", "sanctuary", "school", "shrine", "stadium",
  "temple", "theater", "tomb", "tunnel", "university", "village", "warehouse", "well",
  // Science & medicine
  "acid", "alloy", "atom", "bacteria", "bone", "brain", "cell", "chemical", "circuit", "clone",
  "comet", "crystal", "decay", "disease", "element", "enzyme", "fever", "fossil", "galaxy", "gene",
  "gravity", "heart", "hormone", "infection", "ion", "laser", "liquid", "magnet", "membrane", "metal",
  "microscope", "mineral", "molecule", "muscle", "nebula", "nerve", "nucleus", "orbit", "organ", "oxygen",
  "particle", "photon", "plague", "planet", "plasma", "poison", "protein", "pulse", "radiation", "reaction",
  "signal", "skeleton", "skull", "solar", "species", "spore", "surgery", "synapse", "tissue", "toxin",
  "vaccine", "vein", "virus", "voltage", "wave",
  // Arts & culture
  "album", "anthem", "archive", "artifact", "ballet", "ballad", "canvas", "ceremony", "chord", "chorus",
  "cinema", "comedy", "concert", "dance", "drama", "elegy", "epic", "exhibit", "fable", "fantasy",
  "festival", "fiction", "film", "folklore", "fresco", "gallery", "genre", "harmony", "hymn", "idol",
  "instrument", "legend", "lyric", "manuscript", "melody", "mural", "myth", "novel", "opera", "orchestra",
  "painting", "parable", "poem", "portrait", "prose", "ritual", "romance", "sculpture", "sketch", "sonata",
  "song", "story", "symphony", "tragedy", "verse",
  // Sports & activities
  "archery", "boxing", "chess", "climbing", "combat", "cycling", "diving", "duel", "expedition", "exploration",
  "fencing", "fishing", "gymnastics", "hiking", "hunting", "jousting", "marathon", "meditation", "navigation",
  "racing", "rowing", "sailing", "skiing", "soccer", "swimming", "tennis", "tournament", "wrestling",
  // Space & cosmos
  "asteroid", "atmosphere", "aurora", "black hole", "comet", "cosmos", "eclipse", "galaxy", "gravity",
  "meteor", "nebula", "nova", "orbit", "planet", "satellite", "solar", "star", "supernova", "universe",
  // Materials
  "amber", "bronze", "carbon", "clay", "coal", "copper", "cotton", "diamond", "emerald", "flint",
  "gold", "granite", "ice", "iron", "jade", "lava", "lead", "leather", "marble", "mercury",
  "obsidian", "pearl", "platinum", "quartz", "ruby", "rust", "sapphire", "silver", "smoke", "steel",
  "tin", "titanium", "wood",
];

async function computeGlobalPca() {
  logger.info(`Computing global PCA on ${REFERENCE_VOCABULARY.length} reference words...`);
  const vectors = await getEmbeddings(REFERENCE_VOCABULARY);
  globalPcaParams = computePcaFromVectors(vectors);
  logger.info("Global PCA ready");
}

async function seedWordLibrary() {
  const { db, wordEmbeddingsTable } = await import("@workspace/db");

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(wordEmbeddingsTable);

  if (count > 0) {
    logger.info({ count }, "Word library already seeded");
    return;
  }

  const pca = getGlobalPcaParams();
  const uniqueWords = [...new Set(WORD_LIBRARY)];
  logger.info(`Seeding word library with ${uniqueWords.length} words...`);

  const BATCH = 50;
  for (let i = 0; i < uniqueWords.length; i += BATCH) {
    const batch = uniqueWords.slice(i, i + BATCH);
    const vectors = await getEmbeddings(batch);
    const rows = batch.map((word, j) => {
      const p = projectTo3D(vectors[j], pca);
      return {
        word,
        embedding: vectors[j] as unknown as number[],
        x: p.x * COORD_SCALE,
        y: p.y * COORD_SCALE,
        z: p.z * COORD_SCALE,
      };
    });
    await db.insert(wordEmbeddingsTable).values(rows).onConflictDoNothing();
    logger.info(`  seeded ${Math.min(i + BATCH, uniqueWords.length)} / ${uniqueWords.length}`);
  }

  logger.info("Word library seeding complete");
}

export function getTemperature(distance: number): "freezing" | "cold" | "cool" | "warm" | "hot" | "correct" {
  if (distance === 0) return "correct";
  if (distance < 0.15) return "hot";
  if (distance < 0.3) return "warm";
  if (distance < 0.5) return "cool";
  if (distance < 0.7) return "cold";
  return "freezing";
}

function pickClueAt(
  candidates: Array<{ word: string; x: number; y: number; z: number; embedding: number[]; sim: number }>,
  targetSim: number,
  exclude: string[]
) {
  const pool = candidates.filter((c) => !exclude.includes(c.word));
  if (pool.length === 0) return null;
  return pool.reduce((best, c) =>
    Math.abs(c.sim - targetSim) < Math.abs(best.sim - targetSim) ? c : best
  );
}

export async function generatePuzzle(date?: string) {
  const { db, puzzlesTable, wordEmbeddingsTable } = await import("@workspace/db");
  const pca = getGlobalPcaParams();

  // Pick a random target from the library
  const [target] = await db
    .select()
    .from(wordEmbeddingsTable)
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (!target) throw new Error("Word library is empty — seed first");

  // Load all words to compute similarities in JS
  const allWords = await db.select().from(wordEmbeddingsTable);
  const targetEmb = target.embedding as unknown as number[];

  const candidates = allWords
    .filter((w) => w.word !== target.word)
    .map((w) => ({
      word: w.word,
      x: w.x,
      y: w.y,
      z: w.z,
      embedding: w.embedding as unknown as number[],
      sim: cosineSimilarity(w.embedding as unknown as number[], targetEmb),
    }))
    // Good clue range: clearly related but not identical; not completely unrelated
    .filter((w) => w.sim >= 0.28 && w.sim <= 0.78);

  if (candidates.length < 3) {
    throw new Error(`Not enough clue candidates for target "${target.word}" (found ${candidates.length})`);
  }

  const used: string[] = [];
  const clue1 = pickClueAt(candidates, 0.65, used)!; used.push(clue1.word);
  const clue2 = pickClueAt(candidates, 0.50, used)!; used.push(clue2.word);
  const clue3 = pickClueAt(candidates, 0.35, used)!; used.push(clue3.word);

  const clues = [clue1, clue2, clue3].map((c) => ({
    word: c.word, x: c.x, y: c.y, z: c.z,
  }));

  const embeddingVectors: Record<string, number[]> = {
    [target.word]: targetEmb,
    [clue1.word]: clue1.embedding,
    [clue2.word]: clue2.embedding,
    [clue3.word]: clue3.embedding,
  };

  const [puzzle] = await db.insert(puzzlesTable).values({
    date: date ?? new Date().toISOString(),
    targetWord: target.word,
    targetX: String(target.x),
    targetY: String(target.y),
    targetZ: String(target.z),
    clues,
    embeddingVectors,
    pcaParams: pca,
  }).returning();

  logger.info({ target: target.word, clues: clues.map(c => c.word) }, "Puzzle generated");
  return puzzle;
}

export function getRandomPuzzleSet() {
  return null; // No longer used — puzzles are fully auto-generated from the library
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

  await generatePuzzle(today);
}

loadPipeline().catch((err) => logger.error({ err }, "Pipeline init error"));
