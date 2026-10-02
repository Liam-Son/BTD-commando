import { useDataset } from "@/lib/data-resilience";
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, BookmarkPlus, Radio, Search, Trash2 } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { NewsFeed } from "@/components/btd/NewsFeed";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { useLiveRankings } from "@/hooks/useLiveRankings";
import { fmtPct, ratingFor, type AssetClass } from "@/lib/btd-core";

export const Route = createFileRoute("/communication")({
  head: () => ({
    meta: [
      { title: "Communication | BTD Commando" },
      {
        name: "description",
        content: "Live BTD signals, market context, and analyst notes.",
      },
    ],
  }),
  component: CommunicationPage,
});

type FeedTab = "signals" | "news";
type AssetFilter = "ALL" | AssetClass;
type AnalystNote = { id: number; text: string; createdAt: string };
type EchoState = "CLEAR" | "ACK" | "HOLD" | "CHECK";
type EchoEvent = { id: number; label: string; message: string; createdAt: string };

const FILTERS: AssetFilter[] = ["ALL", "Stock", "Crypto", "ETF", "Commodity", "Index"];
const NOTES_KEY = "btd.communication.notes.v1";
const ECHO_LOG_KEY = "btd.communication.echo-log.v1";
const ECHO_SIGNALS = [
  ["ACK", "ACK RECEIVED", "ECHO: Signal logged. Keep the channel clear."],
  ["HOLD", "HOLD SIGNAL", "ECHO: Copy. I’ll hold the channel until you’re ready."],
  ["CHECK", "REQUEST CHECK-IN", "ECHO: Check-in requested. No private details required."],
] as const;

function CommunicationPage() {
  const { data, isPending, error, isLive } = useLiveRankings();
  const [newsFilter, setNewsFilter] = useState("all");
  const [newsState, setNewsState] = useState("SYNCING");
  const [feed, setFeed] = useState<FeedTab>("signals");
  const [filter, setFilter] = useState<AssetFilter>("ALL");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const { value: notes, setValue: setNotes, issue: notesIssue } = useDataset<AnalystNote[]>("notes", () => []);
  const [echoState, setEchoState] = useState<EchoState>("CLEAR");
  const [echoSignal, setEchoSignal] = useState("Signal channel ready.");
  const { value: echoEvents, setValue: setEchoEvents, issue: echoIssue } = useDataset<EchoEvent[]>("echo", () => []);

  const assets = data?.assets ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const visibleAssets = assets
    .filter((asset) => filter === "ALL" || asset.assetClass === filter)
    .filter(
      (asset) =>
        !normalizedSearch ||
        `${asset.symbol} ${asset.name} ${asset.country}`.toLowerCase().includes(normalizedSearch),
    )
    .sort((left, right) => right.btdScore - left.btdScore);
  const regions = Object.entries(
    assets.reduce<Record<string, number>>((counts, asset) => {
      const region = asset.country || "Global";
      counts[region] = (counts[region] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);
  const strongest = visibleAssets[0];
  const maxRegionCount = regions[0]?.[1] ?? 1;

  function saveNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const next = [{ id: Date.now(), text, createdAt: new Date().toISOString() }, ...notes].slice(
      0,
      8,
    );
    setNotes(next);
    setDraft("");

  }

  function removeNote(id: number) {
    const next = notes.filter((note) => note.id !== id);
    setNotes(next);

  }

  function recordEcho(state: EchoState, label: string, message: string) {
    const event = { id: Date.now(), label, message, createdAt: new Date().toISOString() };
    const next = [event, ...echoEvents].slice(0, 4);
    setEchoState(state);
    setEchoSignal(message);
    setEchoEvents(next);

  }

  function clearEchoChannel() {
    const message = "ECHO: Channel clear. No active signal request.";
    setEchoState("CLEAR");
    setEchoSignal(message);
    setEchoEvents([]);

  }

  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader
        active="communication"
        status={
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "live-dot bg-up" : "bg-warn"}`} />
            {isLive ? "Signal feed live" : "Snapshot feed"}
          </span>
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6">
        {(notesIssue || echoIssue) && <p role="alert" className="text-warn">{notesIssue || echoIssue}</p>}
        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="pixel-title text-sm text-primary">Operations desk / intel channel</p>
            <h1 className="pixel-title mt-1 text-3xl leading-none sm:text-4xl">Communication</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Market context and BTD signals from the live ranking feed. Signals are research, not
              orders.
            </p>
          </div>
          <div className="tabular flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
            {data
              ? `UPDATED ${new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "WAITING FOR FEED"}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Communication overview">
          <div className="mil-panel flex items-center justify-between p-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Tracked assets
              </p>
              <p className="tabular mt-1 text-2xl font-bold">{data?.assets.length ?? "--"}</p>
            </div>
            <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="mil-panel flex items-center justify-between p-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Top BTD signal
              </p>
              <p className="mt-1 text-lg font-bold">{strongest?.symbol ?? "--"}</p>
            </div>
            <span className="tabular text-2xl font-bold text-primary">
              {strongest ? strongest.btdScore.toFixed(1) : "--"}
            </span>
          </div>
          <div className="mil-panel flex items-center justify-between p-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Market fear & greed
              </p>
              <p className="mt-1 text-lg font-bold">
                {data?.fear.fearGreedLabel ?? "--"}
                <span className="tabular ml-2 text-sm text-primary">
                  {data?.fear.fearGreed === null || data?.fear.fearGreed === undefined
                    ? "--"
                    : Math.round(data.fear.fearGreed)}
                </span>
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              VIX{" "}
              {data?.fear.vix === null || data?.fear.vix === undefined
                ? "--"
                : data.fear.vix.toFixed(2)}
            </span>
          </div>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
          <section className="mil-panel min-w-0" aria-labelledby="feed-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  01 / Intel feed
                </p>
                <h2 id="feed-title" className="pixel-title text-xl">
                  Live signals & market news
                </h2>
              </div>
              <div
                className="flex border border-border bg-background p-0.5"
                role="tablist"
                aria-label="Feed type"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={feed === "signals"}
                  onClick={() => setFeed("signals")}
                  className={`mil-tab ${feed === "signals" ? "mil-tab-active" : "text-muted-foreground"}`}
                >
                  BTD signals
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={feed === "news"}
                  onClick={() => setFeed("news")}
                  className={`mil-tab ${feed === "news" ? "mil-tab-active" : "text-muted-foreground"}`}
                >
                  News feed
                </button>
              </div>
            </div>

            {feed === "signals" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="flex flex-wrap gap-1" aria-label="Filter by asset class">
                    {FILTERS.map((option) => (
                      <button
                        type="button"
                        key={option}
                        aria-pressed={filter === option}
                        onClick={() => setFilter(option)}
                        className={`border px-2 py-1 text-[10px] font-bold uppercase ${
                          filter === option
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option === "ALL" ? "All" : option}
                      </button>
                    ))}
                  </div>
                  <label className="flex min-w-48 items-center gap-2 border border-border bg-background px-2 py-1.5 text-muted-foreground">
                    <Search className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">Search signals</span>
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Symbol, name, region"
                      className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </label>
                </div>

                {isPending ? (
                  <p className="p-6 text-sm text-muted-foreground">Receiving the BTD snapshot…</p>
                ) : error ? (
                  <div className="flex items-center gap-2 p-6 text-sm text-down">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    Signal feed is unavailable. Try again after the next refresh.
                  </div>
                ) : visibleAssets.length ? (
                  <div className="divide-y divide-border">
                    {visibleAssets.slice(0, 20).map((asset, index) => {
                      const rating = ratingFor(asset.btdScore);
                      return (
                        <article
                          key={asset.symbol}
                          className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="tabular mt-0.5 w-6 shrink-0 text-xs text-muted-foreground">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <h3 className="font-bold">{asset.symbol}</h3>
                                <span className="text-xs text-muted-foreground">
                                  {asset.name} · {asset.country}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {asset.reasons[0] ?? "No dominant dip signal"}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {asset.factors.slice(0, 3).map((factor) => (
                                  <span
                                    key={factor.key}
                                    className="border border-border px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground"
                                  >
                                    {factor.label}{" "}
                                    <span className="tabular text-foreground">
                                      {factor.value.toFixed(0)}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4 pl-9 sm:justify-end sm:pl-0">
                            <div className="text-right">
                              <p className="tabular text-lg font-bold text-primary">
                                {asset.btdScore.toFixed(1)}
                              </p>
                              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                                Research rating · {rating.label}
                              </p>
                            </div>
                            <div className="tabular min-w-16 text-right text-xs">
                              <p className={asset.changeDay >= 0 ? "text-up" : "text-down"}>
                                {fmtPct(asset.changeDay)}
                              </p>
                              <p className="mt-1 text-muted-foreground">1D</p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="p-6 text-sm text-muted-foreground">
                    No BTD signals match these filters.
                  </p>
                )}
                <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
                  Showing {Math.min(visibleAssets.length, 20)} of {visibleAssets.length} matching
                  live ranking signals.
                </div>
              </>
            ) : (
              <NewsFeed assets={assets.map((asset) => asset.symbol)} filter={newsFilter} onFilterChange={setNewsFilter} onStatusChange={setNewsState} />
            )}
          </section>

          <aside className="space-y-4">
            <section className="mil-panel" aria-labelledby="status-title">
              <div className="border-b border-border px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  02 / Signal status
                </p>
                <h2 id="status-title" className="pixel-title text-xl">
                  Feed monitor
                </h2>
              </div>
              <div className="space-y-3 p-4">
                <StatusRow
                  label="BTD rankings"
                  state={data ? "ONLINE" : isPending ? "SYNCING" : "OFFLINE"}
                  online={Boolean(data)}
                />
                <StatusRow
                  label="Live prices"
                  state={isLive ? "ONLINE" : "SNAPSHOT"}
                  online={isLive}
                />
                <StatusRow label="External headlines" state={feed === "news" ? newsState : "OPEN NEWS TO CHECK"} online={feed === "news" && newsState === "ONLINE"} />
                {data?.degraded.length ? (
                  <div className="border-t border-border pt-3 text-xs text-warn">
                    Partial data: {data.degraded.join(", ")}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mil-panel overflow-hidden" aria-labelledby="echo-title">
              <div className="flex items-center gap-3 border-b border-border bg-surface-2 p-3">
                <div className="h-16 w-16 overflow-hidden border-2 border-primary bg-background">
                  <img
                    src="/theme/communication/echo_buddy.png"
                    alt="ECHO communication specialist"
                    className="h-full w-full object-contain object-center"
                    loading="eager"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    ECHO // SIGNAL BUDDY
                  </p>
                  <h2 id="echo-title" className="pixel-title text-xl text-primary">
                    CHANNEL CHECK
                  </h2>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <p className="text-xs text-muted-foreground">
                  Keep communication clear without turning a signal into an order. ECHO handles
                  acknowledgements, holds, and check-ins.
                </p>
                <div className="flex items-center justify-between border border-border bg-background px-3 py-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Channel state
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {echoState === "CLEAR"
                      ? "CLEAR"
                      : echoState === "ACK"
                        ? "ACK LOGGED"
                        : echoState === "HOLD"
                          ? "SIGNAL ON HOLD"
                          : "CHECK-IN REQUESTED"}
                  </span>
                </div>
                <p
                  className="border-l-2 border-primary pl-3 text-xs text-foreground/85"
                  role="status"
                >
                  {echoSignal}
                </p>
                <div className="grid gap-2">
                  {ECHO_SIGNALS.map(([key, label, response]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => recordEcho(key, label, response)}
                      className={`border px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide hover:border-primary hover:text-primary ${echoState === key ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={clearEchoChannel}
                  className="w-full border border-dashed border-border px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-primary hover:text-primary"
                >
                  CLEAR CHANNEL
                </button>
                <div className="border-t border-border pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Recent channel log
                    </span>
                    <span className="tabular text-[10px] text-muted-foreground">
                      {echoEvents.length}/4
                    </span>
                  </div>
                  {echoEvents.length ? (
                    <div className="space-y-2">
                      {echoEvents.map((event) => (
                        <div key={event.id} className="border-l border-border pl-2">
                          <div className="flex items-center justify-between gap-2 text-[10px]">
                            <span className="font-bold text-primary">{event.label}</span>
                            <time
                              className="tabular text-muted-foreground"
                              dateTime={event.createdAt}
                            >
                              {new Date(event.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                          </div>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {event.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      No signal events on this device.
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  ECHO shares signal state only. No private health or account details are exposed.
                </p>
              </div>
            </section>

            <section className="mil-panel" aria-labelledby="region-title">
              <div className="border-b border-border px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  03 / Coverage
                </p>
                <h2 id="region-title" className="pixel-title text-xl">
                  Regional monitor
                </h2>
              </div>
              {regions.length ? (
                <div className="space-y-3 p-4">
                  {regions.map(([region, count]) => (
                    <div key={region}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{region}</span>
                        <span className="tabular text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 bg-surface-2">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(count / maxRegionCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-xs text-muted-foreground">
                  Coverage appears when the ranking feed is available.
                </p>
              )}
            </section>

            <section className="mil-panel" aria-labelledby="notes-title">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    04 / Analyst desk
                  </p>
                  <h2 id="notes-title" className="pixel-title text-xl">
                    Field notes
                  </h2>
                </div>
                <BookmarkPlus className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <form onSubmit={saveNote} className="border-b border-border p-3">
                <label className="sr-only" htmlFor="communication-note">
                  Add a private note
                </label>
                <textarea
                  id="communication-note"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={280}
                  rows={2}
                  placeholder="Record a research observation…"
                  className="w-full resize-y border border-border bg-background p-2 text-xs outline-none focus:border-primary"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Stored in this browser only
                  </span>
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="border border-primary px-2 py-1 text-[10px] font-bold uppercase text-primary disabled:opacity-40"
                  >
                    Save note
                  </button>
                </div>
              </form>
              <div className="divide-y divide-border">
                {notes.length ? (
                  notes.map((note) => (
                    <article key={note.id} className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                          {note.text}
                        </p>
                        <time
                          className="tabular mt-1 block text-[10px] text-muted-foreground"
                          dateTime={note.createdAt}
                        >
                          {new Date(note.createdAt).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </time>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNote(note.id)}
                        className="shrink-0 p-1 text-muted-foreground hover:text-down"
                        aria-label="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </article>
                  ))
                ) : (
                  <p className="p-3 text-xs text-muted-foreground">
                    No notes saved on this device.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function StatusRow({ label, state, online }: { label: string; state: string; online: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-bold">
        <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-up" : "bg-warn"}`} />
        {state}
      </span>
    </div>
  );
}
