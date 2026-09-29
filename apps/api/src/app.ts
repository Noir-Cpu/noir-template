import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sql } from "drizzle-orm";
import { createDb } from "@noir/db";

export type Env = { DATABASE_URL: string };

export const app = new Hono<{ Bindings: Env }>().basePath("/api");

app.get("/health", (c) => c.json({ ok: true }));

app.get("/health/db", async (c) => {
  const started = Date.now();
  try {
    await createDb(c.env.DATABASE_URL).execute(sql`select 1`);
    return c.json({ ok: true, ms: Date.now() - started });
  } catch {
    return c.json({ ok: false }, 503);
  }
});

app.post(
  "/echo",
  zValidator("json", z.object({ message: z.string().min(1).max(200) })),
  (c) => c.json({ message: c.req.valid("json").message }),
);
