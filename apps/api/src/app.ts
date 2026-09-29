import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export type Env = { DATABASE_URL: string };

export const app = new Hono<{ Bindings: Env }>().basePath("/api");

app.get("/health", (c) => c.json({ ok: true }));

app.post(
  "/echo",
  zValidator("json", z.object({ message: z.string().min(1).max(200) })),
  (c) => c.json({ message: c.req.valid("json").message }),
);
