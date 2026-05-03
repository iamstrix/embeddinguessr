import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const puzzlesTable = pgTable("puzzles", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  targetWord: text("target_word").notNull(),
  targetX: text("target_x").notNull(),
  targetY: text("target_y").notNull(),
  targetZ: text("target_z").notNull(),
  clues: jsonb("clues").notNull(),
  embeddingVectors: jsonb("embedding_vectors").notNull(),
  pcaParams: jsonb("pca_params"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPuzzleSchema = createInsertSchema(puzzlesTable).omit({ id: true, createdAt: true });
export type InsertPuzzle = z.infer<typeof insertPuzzleSchema>;
export type Puzzle = typeof puzzlesTable.$inferSelect;
