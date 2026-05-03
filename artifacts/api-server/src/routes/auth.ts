import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, appUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body as { username: string; password: string };
  const trimmed = username?.trim().toLowerCase();

  if (!trimmed || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const [user] = await db.select().from(appUsersTable).where(eq(appUsersTable.username, trimmed));

  if (!user) {
    res.status(401).json({ error: "No account found with that username" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  res.json({ id: user.id, username: user.username });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, password } = req.body as { username: string; password: string };
  const trimmed = username?.trim().toLowerCase();

  if (!trimmed || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  if (trimmed.length < 2 || trimmed.length > 24) {
    res.status(400).json({ error: "Username must be 2–24 characters" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existing] = await db.select().from(appUsersTable).where(eq(appUsersTable.username, trimmed));
  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const [newUser] = await db
    .insert(appUsersTable)
    .values({ username: trimmed, passwordHash: hash })
    .returning();

  res.json({ id: newUser.id, username: newUser.username });
});

export default router;
