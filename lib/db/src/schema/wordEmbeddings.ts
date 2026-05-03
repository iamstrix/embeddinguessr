import { pgTable, text, jsonb, doublePrecision } from "drizzle-orm/pg-core";

export const wordEmbeddingsTable = pgTable("word_embeddings", {
  word: text("word").primaryKey(),
  embedding: jsonb("embedding").notNull().$type<number[]>(),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
  z: doublePrecision("z").notNull(),
});

export type WordEmbedding = typeof wordEmbeddingsTable.$inferSelect;
