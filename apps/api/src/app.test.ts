import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("api", () => {
  it("reports health", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("rejects an invalid echo payload", async () => {
    const res = await app.request("/api/echo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("tracing", () => {
  it("sets a request id and exports a span when configured", async () => {
    const calls: { url: string; auth: string }[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, auth: (init.headers as Record<string, string>).authorization! });
      return new Response("{}");
    }) as typeof fetch;
    try {
      const pending: Promise<unknown>[] = [];
      const res = await app.request(
        "/api/health",
        { headers: { traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01" } },
        { GRAFANA_OTLP_ENDPOINT: "https://otlp.example/otlp", GRAFANA_OTLP_AUTH: "Basic abc" },
        { waitUntil: (p: Promise<unknown>) => void pending.push(p), passThroughOnException() {} } as never,
      );
      await Promise.all(pending);
      expect(res.headers.get("x-request-id")).toBe("0af7651916cd43dd8448eb211c80319c");
      expect(calls).toEqual([{ url: "https://otlp.example/otlp/v1/traces", auth: "Basic abc" }]);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
