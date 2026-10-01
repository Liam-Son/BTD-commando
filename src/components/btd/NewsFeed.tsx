import { useEffect, useMemo, useState } from "react";

type NewsItem = {
  id: string;
  headline: string;
  url: string;
  publisher: string;
  publishedAt: string;
  categories: string[];
  tickers: string[];
  attentionScore: number;
  severity: "normal" | "high" | "critical";
  flags: string[];
  relatedSources: string[];
  whyItMatters: string;
};

type SourceHealth = { ok: boolean; count: number; latencyMs: number; error?: string };
type SortMode = "top" | "latest";

const FILTERS = ["all", "markets", "macro", "stocks", "crypto", "commodities", "defense", "regulation"];
const DEFAULT_INTEL_ART = { file: "weather/05_rain.png", label: "Weather Intel" };
const INTEL_ART: Record<string, { file: string; label: string }> = {
  markets: { file: "defense/05_defense_budget.png", label: "Defense Demand" },
  macro: { file: "weather/01_storm.png", label: "Weather Intel" },
  stocks: { file: "defense/01_contract.png", label: "Defense Demand" },
  crypto: { file: "defense/03_drone.png", label: "Defense Demand" },
  commodities: { file: "weather/04_drought.png", label: "Weather Intel" },
  defense: { file: "defense/04_military_vehicle.png", label: "Defense Demand" },
  regulation: { file: "defense/01_contract.png", label: "Defense Demand" },
  other: { file: "weather/05_rain.png", label: "Weather Intel" },
};

function intelArtFor(item: NewsItem): { file: string; label: string } {
  const category = item.categories.find((value) => INTEL_ART[value]);
  return INTEL_ART[category ?? "other"] ?? DEFAULT_INTEL_ART;
}

function ageLabel(publishedAt: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

export function NewsFeed({ assets }: { assets: string[] }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<SortMode>("top");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<Record<string, SourceHealth>>({});

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (assets.length) params.set("assets", assets.join(","));
    return params.toString();
  }, [assets]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`/api/news?${query}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as {
          items?: NewsItem[];
          sourceHealth?: Record<string, SourceHealth>;
        };
        if (!active) return;
        setItems(payload.items ?? []);
        setHealth(payload.sourceHealth ?? {});
        setError("");
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "News feed unavailable");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [query]);

  const filtered = filter === "all" ? items : items.filter((item) => item.categories.includes(filter));
  const shown = [...filtered].sort((left, right) =>
    sort === "latest"
      ? new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
      : right.attentionScore - left.attentionScore,
  );
  const criticalCount = items.filter((item) => item.severity === "critical").length;
  const sourceCount = Object.keys(health).length;
  const healthyCount = Object.values(health).filter((source) => source.ok).length;

  return (
    <section className="mil-panel p-4 sm:p-5" aria-labelledby="intel-feed-title">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">02 / Live intelligence</p>
          <h2 id="intel-feed-title" className="pixel-title mt-1 text-xl">News intelligence</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {sourceCount ? `${healthyCount}/${sourceCount} sources online` : "Connecting to sources..."}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" aria-label="Filter intelligence by category">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              className={`border px-2 py-1 text-[10px] font-bold uppercase ${
                filter === option
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1" aria-label="Sort intelligence">
          {(["top", "latest"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={sort === option}
              onClick={() => setSort(option)}
              className={`border px-2 py-1 text-[10px] font-bold uppercase ${
                sort === option ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {option}
            </button>
          ))}
          {criticalCount > 0 && <span className="border border-down/50 px-2 py-1 text-[10px] font-bold text-down">{criticalCount} critical</span>}
        </div>
      </div>

      {error && <div className="mt-3 border border-warn/50 bg-warn/10 px-3 py-2 text-xs text-warn">Feed degraded: {error}</div>}
      {loading ? (
        <p className="py-10 text-sm text-muted-foreground">Receiving external intelligence...</p>
      ) : (
        <div className="mt-3 divide-y divide-border">
          {shown.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group block py-4 first:pt-2 hover:bg-surface-2">
              <div className="flex gap-3">
                <img
                  src={`/theme/intel/${intelArtFor(item).file}`}
                  alt={intelArtFor(item).label}
                  width={1122}
                  height={1402}
                  loading="lazy"
                  decoding="async"
                  className="pixel h-20 w-16 shrink-0 object-contain sm:h-24 sm:w-20"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>{item.publisher}</span>
                    <span aria-hidden="true">/</span>
                    <span>{ageLabel(item.publishedAt)}</span>
                    <span className="ml-auto font-mono text-primary">ATTN {item.attentionScore}</span>
                  </div>
                  <p className="mt-1 font-semibold leading-snug group-hover:text-primary">{item.headline}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.whyItMatters}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.flags.map((flag) => <span key={flag} className="border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{flag}</span>)}
                    {item.tickers.map((ticker) => <span key={ticker} className="border border-primary/40 px-1.5 py-0.5 text-[10px] text-primary">${ticker}</span>)}
                    {item.relatedSources.length > 1 && <span className="border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.relatedSources.length} sources</span>}
                  </div>
                </div>
              </div>
            </a>
          ))}
          {!shown.length && <p className="py-10 text-sm text-muted-foreground">No matching headlines.</p>}
        </div>
      )}
    </section>
  );
}