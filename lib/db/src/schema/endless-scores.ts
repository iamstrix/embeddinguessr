import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const endlessScoresTable = pgTable("endless_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull(),
  playerName: text("player_name").notNull(),
  guessCount: integer("guess_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
