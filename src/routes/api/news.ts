import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
// @ts-expect-error The engine is intentionally kept as a runtime-only ESM module.
import { getNews } from "@/lib/news-engine.mjs";

const VALID_CATEGORIES = new Set([
  "all",
  "markets",
  "macro",
  "stocks",
  "crypto",
  "commodities",
  "defense",
  "regulation",
  "other",
]);

export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const params = new URL(request.url).searchParams;
          const assets = (params.get("assets") ?? "")
            .split(",")
            .map((asset) => asset.trim())
            .filter(Boolean)
            .slice(0, 100);
          const category = (params.get("category") ?? "all").toLowerCase();
          const limit = Math.max(1, Math.min(Number(params.get("limit") ?? 60) || 60, 100));
          const severity = params.get("severity");
          const result = await getNews({ trackedAssets: assets, limit });
          let items = result.items;

          if (VALID_CATEGORIES.has(category) && category !== "all") {
            items = items.filter((item: { categories: string[] }) => item.categories.includes(category));
          }
          if (severity) {
            items = items.filter((item: { severity: string }) => item.severity === severity);
          }

          return Response.json(
            { ...result, items },
            {
              headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
              },
            },
          );
        } catch (error) {
          return Response.json(
            {
              error: "news_engine_failed",
              message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          );
        }
      },
    },
  },
});