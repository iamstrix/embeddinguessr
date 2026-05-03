import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const endlessScoresTable = pgTable("endless_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  appUserId: integer("app_user_id"),
  clerkUserId: text("clerk_user_id"),
  username: text("username").notNull(),
  guessCount: integer("guess_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
