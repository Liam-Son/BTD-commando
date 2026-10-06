import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterIntelItems, normalizeIntelSearch } from "@/lib/intel-search";
import { DataStatus } from "@/components/btd/DataStatus";

type NewsItem = {
  id: string;
  headline: string;
  url: string;
  publisher: string;
  publishedAt: string;
  summary?: string;
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
type NewsStatus = "SYNCING" | "ONLINE" | "DEGRADED" | "OFFLINE";

const FILTERS = [
  "all",
  "markets",
  "macro",
  "stocks",
  "crypto",
  "commodities",
  "defense",
  "regulation",
];

function ageLabel(publishedAt: string) {
  const timestamp = new Date(publishedAt).getTime();
  if (!Number.isFinite(timestamp)) return "date unavailable";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

function fetchedLabel(fetchedAt: number | null) {
  if (!fetchedAt) return "Not fetched yet";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(fetchedAt);
}

export function NewsFeed({
  assets,
  filter,
  onFilterChange,
  onStatusChange,
}: {
  assets: string[];
  filter: string;
  onFilterChange: (category: string) => void;
  onStatusChange?: (state: NewsStatus) => void;
}) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [sort, setSort] = useState<SortMode>("top");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<Record<string, SourceHealth>>({});
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (assets.length) params.set("assets", assets.join(","));
    return params.toString();
  }, [assets]);

  const load = useCallback(async () => {
    if (controllerRef.current) return;
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    controllerRef.current = controller;
    setLoading(true);
    setError("");
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 20_000);

    try {
      const response = await fetch(`/api/news?${query}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as {
        items?: NewsItem[];
        sourceHealth?: Record<string, SourceHealth>;
      };
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setHealth(payload.sourceHealth ?? {});
      setFetchedAt(Date.now());
    } catch (loadError) {
      if (
        (!controller.signal.aborted || timedOut) &&
        requestId === requestIdRef.current &&
        controllerRef.current === controller
      ) {
        setError(
          timedOut
            ? "News request timed out after 20 seconds"
            : loadError instanceof Error
              ? loadError.message
              : "News feed unavailable",
        );
      }
    } finally {
      window.clearTimeout(timeout);
      if (requestId === requestIdRef.current && controllerRef.current === controller) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }, [query]);

  useEffect(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      window.clearInterval(timer);
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [load]);

  const sourceCount = Object.keys(health).length;
  const healthyCount = Object.values(health).filter((source) => source.ok).length;
  const status: NewsStatus = loading
    ? "SYNCING"
    : error
      ? "DEGRADED"
      : healthyCount === 0
        ? "OFFLINE"
        : healthyCount < sourceCount
          ? "DEGRADED"
          : "ONLINE";

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  const filtered = useMemo(
    () => filterIntelItems(items, filter, search) as NewsItem[],
    [filter, items, search],
  );
  const shown = [...filtered].sort((left, right) =>
    sort === "latest"
      ? new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
      : right.attentionScore - left.attentionScore,
  );
  const criticalCount = items.filter((item) => item.severity === "critical").length;
  const categoryCounts = items.reduce<Record<string, number>>((counts, item) => {
    for (const category of item.categories) counts[category] = (counts[category] ?? 0) + 1;
    return counts;
  }, {});
  const normalizedSearch = normalizeIntelSearch(search);

  return (
    <section
      id="news-intelligence"
      className="mil-panel scroll-mt-24 p-4 sm:p-5"
      aria-labelledby="intel-feed-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            02 / External news research
          </p>
          <h2 id="intel-feed-title" className="pixel-title mt-1 text-xl">
            News intelligence
          </h2>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <DataStatus
            compact
            label="INTEL"
            state={loading ? "loading" : error ? "offline" : items.length ? "live" : "empty"}
          />
          <p>
            {sourceCount
              ? `${items.length} stories loaded · ${healthyCount}/${sourceCount} sources online`
              : loading
                ? "Connecting to sources..."
                : "No source status available"}
          </p>
          <p className="mt-1">
            Fetched/check time: {fetchedLabel(fetchedAt)}. This is not a publication-freshness
            claim.
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        ATTN is a keyword-based attention heuristic (34% relevance, 26% topic impact, 20% recency,
        10% corroboration, 10% source weighting), not a probability, verified-truth rating, profit
        expectation, or buy/sell signal. Categories are keyword tags and may overlap.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap gap-1" aria-label="Filter intelligence by category">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => onFilterChange(option)}
              className={`border px-2 py-1 text-[10px] font-bold uppercase ${filter === option ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {option}
              <span className="ml-1 tabular opacity-60">
                {option === "all" ? items.length : (categoryCounts[option] ?? 0)}
              </span>
            </button>
          ))}
        </div>
        <label
          className="min-w-[13rem] flex-1 text-xs text-muted-foreground"
          htmlFor="intel-search"
        >
          Search loaded stories
          <input
            id="intel-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Headline, publisher, ticker, summary"
            className="mt-1 block w-full border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <div className="flex gap-1" aria-label="Sort intelligence">
          {(["top", "latest"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={sort === option}
              onClick={() => setSort(option)}
              className={`border px-2 py-1 text-[10px] font-bold uppercase ${sort === option ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="border border-primary/50 px-2 py-1 text-[10px] font-bold uppercase text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing" : "Refresh"}
          </button>
          {criticalCount > 0 && (
            <span className="border border-down/50 px-2 py-1 text-[10px] font-bold text-down">
              {criticalCount} critical
            </span>
          )}
        </div>
      </div>

      <details className="mt-3 border border-border p-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-semibold text-foreground">
          Source health details ({healthyCount}/{sourceCount} online)
        </summary>
        {sourceCount ? (
          <ul className="mt-2 space-y-1">
            {Object.entries(health).map(([name, source]) => (
              <li key={name}>
                <span className={source.ok ? "text-primary" : "text-warn"}>
                  {name}: {source.ok ? "online" : "unavailable"}
                </span>{" "}
                · {source.count} items · {source.latencyMs}ms
                {source.error ? ` · ${source.error}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">No source-health details were returned by this check.</p>
        )}
      </details>

      {error && (
        <div className="mt-3 border border-warn/50 bg-warn/10 px-3 py-2 text-xs text-warn">
          Feed degraded: {error}
          {items.length ? ". Earlier loaded results remain visible and may be stale." : ""}
        </div>
      )}
      {loading && items.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground" role="status">
          Refreshing. Earlier loaded results remain visible until this check completes.
        </p>
      )}
      {loading && !items.length ? (
        <DataStatus
          className="mt-3"
          state="loading"
          detail="Waiting for the verified headlines provider to respond."
          sources="External headlines"
        />
      ) : (
        <div className="mt-3 divide-y divide-border">
          {shown.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="group block py-4 first:pt-2 hover:bg-surface-2"
            >
              <div className="flex gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="text-primary">{item.categories.join(" / ")}</span>
                    <span>{item.publisher}</span>
                    <span aria-hidden="true">/</span>
                    <span>{ageLabel(item.publishedAt)}</span>
                    <span className="ml-auto font-mono text-primary">
                      ATTN {item.attentionScore}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold leading-snug group-hover:text-primary">
                    {item.headline}
                  </p>
                  {item.summary && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {item.summary.slice(0, 240)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{item.whyItMatters}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.flags.map((flag) => (
                      <span
                        key={flag}
                        className="border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {flag}
                      </span>
                    ))}
                    {item.tickers.map((ticker) => (
                      <span
                        key={ticker}
                        className="border border-primary/40 px-1.5 py-0.5 text-[10px] text-primary"
                      >
                        ${ticker}
                      </span>
                    ))}
                    {item.relatedSources.length > 1 && (
                      <span className="border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {item.relatedSources.length} sources
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
          {!shown.length && (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-foreground">
                {items.length
                  ? `No ${filter === "all" ? "" : `${filter} `}stories${normalizedSearch ? " match this search" : " loaded for this view"}.`
                  : "No verified headlines are available yet."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {items.length
                  ? "Try another category or clear the search."
                  : "This is an empty source response, not proof that the news feed is current and quiet."}
              </p>
              {filter !== "all" && items.length > 0 && (
                <button
                  type="button"
                  onClick={() => onFilterChange("all")}
                  className="mt-3 border border-primary/50 px-3 py-1.5 text-xs font-bold uppercase text-primary hover:bg-primary/10"
                >
                  Show all {items.length} loaded stories
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
