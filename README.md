# EmbeddinGuessr

A 3D semantic word-guessing game powered by AI embeddings. Navigate an invisible galaxy of meaning to find the hidden word — guided only by how close your guesses are in the conceptual space of language.

---

## What is it?

Every word in the English language can be represented as a point in a high-dimensional mathematical space — a "semantic space" — where words with similar meanings cluster together. *Dog* lives near *cat* and *puppy*. *Justice* lives near *law* and *fairness*. These relationships aren't hand-coded; they emerge naturally from training on billions of words of human text.

EmbeddinGuessr drops a hidden target word somewhere in this space and asks you to find it. Each guess you make appears as a glowing point in a 3D visualization, colored by temperature (cold blue = far away, hot red/orange = very close). The game computes the true semantic distance between your guess and the target using a real AI embedding model, and your points arrange themselves in 3D space accordingly. You're not guessing letters — you're navigating meaning.

---

## How to Play

1. **Daily mode** — A new puzzle every day, same word for everyone worldwide. Compete on the leaderboard by solving it in as few guesses as possible.
2. **Endless mode** — Play unlimited puzzles, one after another, any time. Logged-in players can submit scores to the endless leaderboard, tracked by average guesses per game.

**Each guess:**
- Gets scored for semantic distance to the hidden target (0.0 = identical, 1.0 = completely unrelated)
- Appears in the 3D scene as a colored sphere — blue when far, orange/red when hot
- Is sorted in the guess list by closeness, not submission order

**Power-ups:**
- ☀️ **Solar Hint** — reveals 3 real words that are semantically close to the target, giving you a direction to explore
- 🕳️ **Black Hole** — reveals the target word character by character, masked with stars, then unmasked in a cinematic reveal sequence

---

## Key Features

### AI-Powered Semantic Engine
- Uses **MiniLM-L6-v2**, a state-of-the-art sentence embedding model from Hugging Face, running directly in Node.js via `@xenova/transformers`
- No API calls to external services — the model runs fully server-side, on-device
- Embeddings are reduced from 384 dimensions down to 3D using PCA for visualization, while preserving the true high-dimensional distance for scoring

### Immersive 3D Visualization
- Built with **React Three Fiber** and **Three.js**, rendering a live WebGL galaxy of guesses
- Guess spheres pulse, orbit, and respond to proximity — closer guesses glow hotter
- A cinematic "black hole" sequence animates a gravitational void when the void hint is activated
- Full 2D SVG fallback for devices without WebGL support, or when the GPU context is lost

### Daily Leaderboard with Streaks
- One puzzle per day, globally consistent — everyone guesses the same word
- Submit your name after solving to appear on the leaderboard
- Submit-once enforced per session — no editing or re-submitting
- Daily streak tracking: your current and longest streak are displayed and updated automatically on each solve
- Verified badge (✓) for players signed in with Clerk

### Endless Mode Leaderboard
- Unlimited puzzles with Clerk authentication required to submit scores
- Leaderboard aggregates all your endless games: total games played, total guesses, and **average guesses per game** (your key ranking stat)
- Ranked by average guesses ascending — the more efficiently you play over time, the higher you climb

### Authentication (Clerk)
- Sign in with **Replit** or **GitHub**
- Separate development and production user stores — accounts created during development won't transfer to the published app
- Verified badge appears on both leaderboards for authenticated users

---

## Distinctions

| Feature | EmbeddinGuessr | Wordle / letter games | Semantle / semantic games |
|---|---|---|---|
| Visualization | Live 3D spatial map | None / flat list | None |
| Scoring | True AI embedding distance | Exact letter match | Cosine similarity ranking |
| Model runs | Server-side, no API key | N/A | External API |
| Hint system | Solar (nearby words) + Black Hole (masked reveal) | Letter reveals | None |
| Multiplayer | Daily global leaderboard + Endless leaderboard | Some variants | No |
| Streak tracking | Yes | Yes (Wordle) | No |
| Guess feedback | Temperature-colored 3D spheres | Color-coded tiles | Position number only |

---

## Educational Value

### Vocabulary & Language Learning
- Players develop intuition for semantic relationships — discovering that *melody* is closer to *harmony* than to *music*, or that *courageous* sits nearer to *bold* than to *afraid*
- Encourages lateral thinking across domains: what other words live near *glacier*? (cold, mountain, erosion, ancient)
- Works well as a classroom warm-up or vocabulary exercise for secondary and university students

### Understanding AI & Word Embeddings
- The game is a hands-on demonstration of how large language models represent meaning
- Players literally navigate the same mathematical space that underlies GPT, BERT, and every modern AI system that understands text
- Each game session is an intuitive lesson in vector similarity, dimensionality reduction, and semantic clustering — without any math required

### Critical Thinking
- Encourages hypothesis testing: "If *hammer* was cold, maybe I need more abstract concepts..."
- Players develop mental models of conceptual space — a transferable reasoning skill

---

## Potential Use Cases

**Entertainment**
- Daily ritual for word game enthusiasts, comparable to Wordle but with deeper semantic gameplay
- Competitive play via leaderboards — friends can compare daily scores and endless averages

**Education**
- Vocabulary enrichment in language arts classes
- NLP/AI literacy tool: demonstrates embeddings to students without requiring code
- ESL/EFL learning: helps non-native speakers explore conceptual relationships in English

**Research & Exploration**
- Informal exploration of how AI models "understand" language
- Surfaces surprising semantic neighbors that reveal model biases or associations
- Could be adapted to specialized vocabulary domains (medical, legal, scientific) by swapping the word corpus

**Team Building**
- Daily puzzle gives remote teams a shared, low-stakes challenge to bond over
- Endless mode supports async competition across time zones

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind v4 |
| 3D rendering | React Three Fiber, Three.js, @react-three/drei |
| Animation | Framer Motion |
| Backend | Express 5, Node.js |
| Database | PostgreSQL, Drizzle ORM |
| Embeddings | @xenova/transformers (MiniLM-L6-v2) |
| Auth | Clerk (Replit + GitHub login) |
| API contract | OpenAPI → Orval codegen → React Query v5 hooks |
| Monorepo | pnpm workspaces |

---

## Architecture
