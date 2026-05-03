# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Embeddings**: @xenova/transformers (Xenova/all-MiniLM-L6-v2, runs in Node.js)
- **3D rendering**: @react-three/fiber, @react-three/drei, three
- **Auth**: Clerk (`@clerk/express` server-side, `@clerk/react` client-side)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Project: EmbeddinGuessr

A 3D semantic word-guessing game where word embeddings are visualized as points in 3D space.

### Artifacts
- `artifacts/embedding-wordle` — React + Vite frontend (3D game using @react-three/fiber)
- `artifacts/api-server` — Express API server with game logic + embedding computation

### DB Schema
- `lib/db/src/schema/puzzles.ts` — Daily puzzle table (target word, clue words, 3D positions, embedding vectors)
- `lib/db/src/schema/sessions.ts` — Player game sessions (guesses, solved state, playerName, clerkUserId)
- `lib/db/src/schema/streaks.ts` — Daily streak tracking per device (currentStreak, longestStreak, lastSolvedDate)
- `lib/db/src/schema/endless-scores.ts` — Per-game endless mode scores (clerkUserId, playerName, guessCount)

### Auth (Clerk)
- Clerk proxy middleware runs at `/api/__clerk` so browser FAPI calls work
- Server uses `clerkMiddleware()` + `getAuth(req)` for verifying signed-in users
- Frontend uses `ClerkProvider` with `publishableKey` from `VITE_CLERK_PUBLISHABLE_KEY`
- Sign-in/sign-up routes: `/sign-in`, `/sign-up`

### API Routes (all under `/api`)
- `GET /game/daily` — today's puzzle
- `POST /game/endless` — random puzzle for endless mode
- `POST /game/session` — create/resume a session
- `POST /game/session/:id/submit` — submit a guess in a session
- `GET /game/leaderboard` — daily top scores (named sessions only)
- `POST /game/leaderboard/submit` — submit name to daily leaderboard (idempotent — once per session)
- `GET /game/endless/leaderboard` — endless leaderboard (total games, avg guesses per player)
- `POST /game/endless/leaderboard/submit` — submit endless score (requires Clerk auth)
- `GET /game/streak/:deviceId` — current/longest daily streak for a device
- `GET /game/stats` — aggregate stats for today's puzzle
- `POST /game/hint` — solar hint (3 nearby words)
- `POST /game/black-hole` — void hint (masked target word reveal)

### Leaderboard Design
- **Daily**: ranked by fewest guesses; playerName set once per session (idempotent); verified badge for Clerk users
- **Endless**: aggregated per-player (by clerkUserId); ranked by average guesses; requires sign-in to submit

### Embedding Engine
- `artifacts/api-server/src/lib/embeddings.ts` — Loads `@xenova/transformers` (MiniLM-L6-v2), computes word embeddings, runs PCA to reduce to 3D, generates daily puzzles
- Native modules (`onnxruntime-node`, `sharp`) must be in `onlyBuiltDependencies` in pnpm-workspace.yaml
- Both `onnxruntime-node` and `@xenova/transformers` are marked external in esbuild config

### Game Flow
1. On startup, server loads embedding model (~23MB, auto-downloads)
2. After model loads, creates today's puzzle from a curated word set
3. Player fetches daily puzzle (clue words + target position in 3D)
4. Player creates a session with their device ID
5. Player submits word guesses; server computes embedding + interpolated 3D position + temperature
6. Guess positions appear in the 3D scene; player zeroes in on the answer
7. On solve, streak is auto-updated; score submit modal appears after 1.2s delay

### Frontend Scene
- WebGL check on mount: shows full 3D scene if supported, graceful SVG 2D fallback otherwise
- `CanvasErrorBoundary` catches any Three.js runtime errors and falls back to 2D

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
