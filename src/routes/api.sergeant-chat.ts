import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createDualRankRouter } from "@/lib/sergeant-chat/dual_rank_router_core";
import {
  WebRateLimiter,
  requestClientKey,
  type ClientIpMode,
} from "@/lib/sergeant-chat/web_rate_limiter";

const sergeantBase = process.env["SERGEANT_PRIVATE_API_URL"];
const sergeantToken = process.env["SERGEANT_PRIVATE_API_TOKEN"];
const chatTimeoutMs = Math.min(
  55000,
  Math.max(5000, Number(process.env["SERGEANT_CHAT_TIMEOUT_MS"]) || 55000),
);
const configuredClientIpMode = process.env["SERGEANT_WEB_CLIENT_IP_MODE"] ?? "none";

const router = createDualRankRouter({
  ...(sergeantBase ? { sergeantBase } : {}),
  ...(sergeantToken ? { sergeantToken } : {}),
  healthTimeoutMs: 900,
  chatTimeoutMs,
  healthCacheMs: 5000,
  failureCooldownMs: 15000,
  failureCooldownMaxMs: 120000,
  delegatedLocalFirst: true,
  busyCooldownMs: 3000,
});
const limiter = new WebRateLimiter(20, 60000, 5000);
const clientIpMode = (
  ["none", "cloudflare", "real", "xff"].includes(configuredClientIpMode)
    ? configuredClientIpMode
    : "none"
) as ClientIpMode;
const noStore = { "Cache-Control": "no-store" };

export const Route = createFileRoute("/api/sergeant-chat")({
  server: {
    handlers: {
      GET: async () => Response.json(await router.rankStatus(), { headers: noStore }),
      POST: async ({ request }) => {
        const rate = limiter.check(requestClientKey(request, clientIpMode));
        if (!rate.ok)
          return Response.json(
            { error: "rate_limited", retryAfterMs: rate.retryAfterMs },
            {
              status: 429,
              headers: {
                "Retry-After": String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))),
                ...noStore,
              },
            },
          );
        if (Number(request.headers.get("content-length") ?? 0) > 65536)
          return Response.json({ error: "body_too_large" }, { status: 413 });
        let text: string;
        try {
          text = await request.text();
        } catch {
          return Response.json({ error: "invalid_body" }, { status: 400 });
        }
        if (new TextEncoder().encode(text).byteLength > 65536)
          return Response.json({ error: "body_too_large" }, { status: 413 });
        let body: unknown;
        try {
          body = JSON.parse(text);
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }
        const input = body as { message?: unknown; history?: unknown; requestId?: unknown } | null;
        const message = typeof input?.message === "string" ? input.message.trim() : "";
        if (!message || message.length > 4000)
          return Response.json({ error: "invalid_message" }, { status: 400 });
        const supplied = typeof input?.requestId === "string" ? input.requestId.trim() : "";
        const requestId = /^[A-Za-z0-9._:-]{8,96}$/.test(supplied) ? supplied : crypto.randomUUID();
        const reply = await router.resolve(message, input?.history, requestId);
        return Response.json(reply, {
          headers: { ...noStore, "X-Noviark-Rank": reply.rank, "X-Noviark-Request-Id": requestId },
        });
      },
    },
  },
});
