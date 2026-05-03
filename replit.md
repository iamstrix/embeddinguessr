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

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Project: Embedding Wordle

A 3D word-guessing game where word embeddings are visualized as points in 3D space.

### Artifacts
- `artifacts/embedding-wordle` — React + Vite frontend (3D game using @react-three/fiber)
- `artifacts/api-server` — Express API server with game logic + embedding computation

### DB Schema
- `lib/db/src/schema/puzzles.ts` — Daily puzzle table (target word, clue words, 3D positions, embedding vectors)
- `lib/db/src/schema/sessions.ts` — Player game sessions table

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

### Frontend Scene
- WebGL check on mount: shows full 3D scene if supported, graceful SVG 2D fallback otherwise
- `CanvasErrorBoundary` catches any Three.js runtime errors and falls back to 2D

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
