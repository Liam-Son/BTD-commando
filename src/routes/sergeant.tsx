import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ratingFor } from "@/lib/btd-core";
import { useLiveRankings } from "@/hooks/useLiveRankings";
import { useAuth } from "@/hooks/useAuth";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { SergeantHero } from "@/components/btd/SergeantHero";
import {
  BTD_FORMULA_ID,
  SERGEANT_POLICY_ID,
  changeKillConfig,
  defaultBook,
  evaluateKills,
  flagFromScore,
  isRiskLoosening,
  loadSergeantBook,
  markBook,
  opsLogCsv,
  rebalancePaperPosition,
  saveSergeantBook,
  sleeveFromFlag,
  withMarkedPrices,
  type FeedState,
  type Flag,
} from "@/lib/sergeant";

export const Route = createFileRoute("/sergeant")({
  head: () => ({
    meta: [
      { title: "Sergeant — Paper discipline | BTD Commando" },
      {
        name: "description",
        content:
          "BTD Commando Sergeant: persistent paper risk posture from Sniper BTD scores. Score ≠ order. Research only.",
      },
    ],
  }),
  component: SergeantPage,
});

const CHECKLISTS: Record<Flag, string[]> = {
  ACQUIRE: [
    "Confirm feed state and score timestamp.",
    "Confirm no drawdown/global/name kill blocks added exposure.",
    "Keep applied sleeve at or below the configured cap.",
    "If overriding the suggestion, write the reason before the paper fill.",
  ],
  WATCH: [
    "Treat the score as intel, not an order.",
    "Check whether an existing sleeve needs resizing rather than adding exposure.",
    "Record any override reason so the decision is auditable later.",
  ],
  REDUCE: [
    "Prefer exposure reduction over new paper risk.",
    "Review the current book target and any active kills.",
    "Log why the applied sleeve differs from policy, if it does.",
  ],
  "STAND DOWN": [
    "Do not treat a low score as a short signal.",
    "New paper exposure should remain low or zero.",
    "Use an override reason if retaining more than the suggested sleeve.",
  ],
};

function pct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

function num(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function SergeantPage() {
  const { data, isPending, error, isLive, isRefreshingLive, liveUpdatedAt } = useLiveRankings();
  const { user } = useAuth();
  const [book, setBook] = useState(() => defaultBook());
  const [hydrated, setHydrated] = useState(false);
  const [pick, setPick] = useState("");
  const [overridePct, setOverridePct] = useState(0);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [storageState, setStorageState] = useState<"loading" | "persistent" | "migrated" | "degraded">("loading");
  const [storageWarning, setStorageWarning] = useState("");
  const [killDraft, setKillDraft] = useState(() => ({ ...defaultBook().kills }));
  const [killReason, setKillReason] = useState("");

  const assets = data?.assets ?? [];
  const prices = useMemo(
    () => Object.fromEntries(assets.map((asset) => [asset.symbol, asset.price])) as Record<string, number>,
    [assets],
  );

  useEffect(() => {
    const loaded = loadSergeantBook(window.localStorage);
    setBook(loaded.book);
    setKillDraft({ ...loaded.book.kills });
    setStorageState(loaded.status === "migrated" ? "migrated" : loaded.status === "recovered" ? "degraded" : "persistent");
    setStorageWarning(loaded.warning ?? "");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const saved = saveSergeantBook(window.localStorage, book);
    if (!saved.ok) {
      setStorageState("degraded");
      setStorageWarning(saved.error ?? "Sergeant persistence failed.");
    } else {
      setStorageState((prev) => (prev === "migrated" ? "migrated" : "persistent"));
    }
  }, [book, hydrated]);

  useEffect(() => {
    if (!hydrated || !assets.length) return;
    setBook((prev) => withMarkedPrices(prev, prices));
  }, [assets.length, hydrated, liveUpdatedAt, prices]);

  const selected = useMemo(() => {
    if (!assets.length) return null;
    const bySym = pick ? assets.find((a) => a.symbol === pick) : null;
    return bySym ?? assets[0] ?? null;
  }, [assets, pick]);

  const flag = selected ? flagFromScore(selected.btdScore) : null;
  const suggestedSleeve = flag ? sleeveFromFlag(flag) : 0;

  useEffect(() => {
    setOverridePct(suggestedSleeve * 100);
    setReason("");
    setNotice("");
  }, [selected?.symbol, suggestedSleeve]);

  const marked = useMemo(() => markBook(book, prices), [book, prices]);
  const kills = useMemo(() => evaluateKills(book, marked.metrics), [book, marked.metrics]);
  const currentPosition = selected
    ? marked.positions.find((p) => p.symbol === selected.symbol) ?? null
    : null;
  const feedState: FeedState = error || (!isPending && assets.length === 0)
    ? "down"
    : data?.degraded.length
      ? "degraded"
      : isLive
        ? "live"
        : "snapshot";
  const appliedSleeve = Math.min(1, Math.max(0, overridePct / 100));
  const increasing = appliedSleeve > (currentPosition?.targetSleeve ?? 0) + 1e-9;
  const newNameBlocked = !currentPosition && increasing && marked.metrics.activeNames >= book.kills.maxNames;
  const hardIncreaseBlocked = increasing && (book.kills.globalHalt || kills.drawdown || kills.sleeve || feedState === "down");
  const sleeveBlocked = increasing && appliedSleeve * 100 > book.kills.maxSleevePct + 1e-9;
  const acquireFrozen =
    flag === "ACQUIRE" &&
    (book.kills.globalHalt ||
      kills.drawdown ||
      kills.sleeve ||
      feedState === "down" ||
      (!currentPosition && marked.metrics.activeNames >= book.kills.maxNames) ||
      suggestedSleeve * 100 > book.kills.maxSleevePct + 1e-9);

  function applyPaperPosture() {
    if (!selected || !flag) return;
    const result = rebalancePaperPosition(book, {
      symbol: selected.symbol,
      name: selected.name,
      assetClass: selected.assetClass,
      price: selected.price,
      score: selected.btdScore,
      flag,
      suggestedSleeve,
      appliedSleeve,
      reason,
      feedState,
    });
    if (result.ok === false) {
      setNotice(result.error);
      return;
    }
    setBook(result.book);
    setNotice(`${result.row.action}: ${selected.symbol} paper target ${pct(result.row.appliedSleeve ?? 0)} logged.`);
    setReason("");
  }

  const killDirty =
    killDraft.maxDrawdownPct !== book.kills.maxDrawdownPct ||
    killDraft.maxNames !== book.kills.maxNames ||
    killDraft.maxSleevePct !== book.kills.maxSleevePct;
  const killLoosening = isRiskLoosening(book.kills, { ...killDraft, globalHalt: book.kills.globalHalt });

  function applyKillLimits() {
    const result = changeKillConfig(
      book,
      { ...killDraft, globalHalt: book.kills.globalHalt },
      killReason,
    );
    if (result.ok === false) {
      setNotice(result.error);
      return;
    }
    setBook(result.book);
    setKillDraft({ ...result.book.kills });
    setKillReason("");
    setNotice("Kill controls updated and logged.");
  }

  function toggleGlobalHalt() {
    const nextHalt = !book.kills.globalHalt;
    const result = changeKillConfig(
      book,
      { ...book.kills, globalHalt: nextHalt },
      nextHalt ? "Global halt enabled from Sergeant desk" : killReason,
    );
    if (result.ok === false) {
      setNotice(result.error);
      return;
    }
    setBook(result.book);
    setKillDraft({ ...result.book.kills });
    setKillReason("");
    setNotice(nextHalt ? "GLOBAL HALT enabled and logged." : "Global halt released and logged.");
  }

  function exportCsv() {
    const blob = new Blob([opsLogCsv(book.log)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sergeant-ops-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader
        active="sergeant"
        signedIn={!!user}
        status={
          <span className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isRefreshingLive ? "bg-warn" : isLive ? "bg-up" : "bg-muted-foreground"
              }`}
            />
            Paper desk
          </span>
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-4 pt-6">
        <SergeantHero />
      </div>

      <div id="paper-book" className="mx-auto max-w-[1200px] space-y-4 px-4 py-6">
        <section className="rounded border border-border bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                BTD Commando · Sergeant / SGT
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Paper discipline desk</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Sniper supplies the score. Sergeant applies a separate, versioned paper policy to a normalized
                100-unit book. No broker connection, no API keys, no live orders.
              </p>
            </div>
            <div className="rounded border border-border bg-background px-3 py-2 text-[11px] text-muted-foreground">
              <div>Formula <span className="font-mono text-foreground">{BTD_FORMULA_ID}</span></div>
              <div>Policy <span className="font-mono text-foreground">{SERGEANT_POLICY_ID}</span></div>
              <div>Storage <span className="text-foreground">{hydrated ? storageState : "loading"}</span></div>
            </div>
          </div>
        </section>

        <section className="rounded border border-primary/30 bg-primary/5 px-4 py-3 text-[11px] font-medium tracking-wide text-foreground">
          ROE · score ≠ order · paper only · {BTD_FORMULA_ID} · {SERGEANT_POLICY_ID} · not investment advice · no live-order path
        </section>

        {storageWarning && (
          <section className="rounded border border-warn/40 bg-warn/10 px-4 py-3 text-[12px] text-muted-foreground">
            Storage: {storageWarning}
          </section>
        )}

        {(error || data?.degraded.length || !isLive || (!isPending && assets.length === 0)) && (
          <section className="rounded border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
            <p className="font-semibold">Data state: {feedState.toUpperCase()}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {error
                ? "Sniper feed request failed. Existing paper book remains visible; do not treat stale values as live."
                : data?.degraded.length
                  ? `Degraded inputs: ${data.degraded.join(" · ")}`
                  : "Live quote overlay is unavailable; Sergeant is using the latest snapshot."}
            </p>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded border border-border bg-surface p-5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Intel → paper intent</p>
            {isPending && !data ? (
              <div className="mt-4 h-40 animate-pulse rounded-sm bg-surface-2" />
            ) : !selected || !flag ? (
              <div className="mt-4 rounded border border-warn/40 bg-warn/10 p-4 text-sm">
                <p className="font-semibold">No usable Sniper assets available.</p>
                <p className="mt-1 text-[12px] text-muted-foreground">The existing paper book and ops log stay available below. No synthetic fill is created without a valid score and reference price.</p>
              </div>
            ) : (
              <>
                <label className="mt-3 block text-[11px] text-muted-foreground">
                  Symbol
                  <select
                    className="mt-1 w-full rounded border border-border bg-background px-2 py-2 text-sm text-foreground"
                    value={selected.symbol}
                    onChange={(e) => setPick(e.target.value)}
                  >
                    {assets.slice(0, 120).map((a) => (
                      <option key={a.symbol} value={a.symbol}>
                        {a.symbol} — BTD {a.btdScore.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.symbol} · {selected.assetClass} · paper fill ref {selected.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-3xl font-bold text-primary">{selected.btdScore.toFixed(1)}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {ratingFor(selected.btdScore).label}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded border border-border bg-background p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Policy flag</p>
                    <p className="mt-1 font-mono text-lg font-bold">{flag}</p>
                  </div>
                  <div className="rounded border border-border bg-background p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Suggested sleeve</p>
                    <p className="mt-1 text-lg font-bold">{pct(suggestedSleeve)}</p>
                  </div>
                  <div className="rounded border border-border bg-background p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current paper sleeve</p>
                    <p className="mt-1 text-lg font-bold">{pct(currentPosition?.targetSleeve ?? 0)}</p>
                  </div>
                </div>

                {acquireFrozen && (
                  <div className="mt-3 rounded border border-down/40 bg-down/10 px-3 py-2 text-[12px] text-down">
                    ACQUIRE suggestion frozen by current kill rules. Reductions remain available.
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
                  <label className="text-[11px] text-muted-foreground">
                    Applied paper sleeve %
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={overridePct}
                      onChange={(e) => setOverridePct(num(e.target.value, 0))}
                      className="mt-1 w-full rounded border border-border bg-background px-2 py-2 text-sm text-foreground"
                    />
                  </label>
                  <label className="text-[11px] text-muted-foreground">
                    Override / decision reason {Math.abs(appliedSleeve - suggestedSleeve) > 1e-9 ? "(required)" : "(optional)"}
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why this paper size?"
                      className="mt-1 w-full rounded border border-border bg-background px-2 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>

                {(hardIncreaseBlocked || newNameBlocked || sleeveBlocked) && (
                  <p className="mt-3 text-[12px] text-down">
                    This increase is blocked by an active kill/cap. Lower the paper sleeve or reduce exposure first.
                  </p>
                )}

                <button
                  type="button"
                  onClick={applyPaperPosture}
                  className="mt-4 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Apply + log paper posture
                </button>
                {notice && <p className="mt-2 text-[12px] text-muted-foreground">{notice}</p>}
              </>
            )}
          </div>

          <div className="rounded border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Kill switches</p>
              <span className={kills.any ? "text-[11px] font-semibold text-down" : "text-[11px] text-up"}>
                {kills.any ? "TRIPPED / LIMIT" : "CLEAR"}
              </span>
            </div>

            <div className="mt-4 rounded border border-border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Global halt</p>
                  <p className="text-[11px] text-muted-foreground">Immediate paper exposure freeze. Reductions/closures remain available.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleGlobalHalt}
                  className={`rounded px-3 py-2 text-xs font-semibold ${book.kills.globalHalt ? "border border-border bg-surface text-foreground" : "bg-down text-white"}`}
                >
                  {book.kills.globalHalt ? "Release halt" : "HALT NOW"}
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-[11px] text-muted-foreground">
                Max DD %
                <input
                  type="number" min={0.1} max={100} step={0.5}
                  value={killDraft.maxDrawdownPct}
                  onChange={(e) => setKillDraft((prev) => ({ ...prev, maxDrawdownPct: num(e.target.value, prev.maxDrawdownPct) }))}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-2 text-sm text-foreground"
                />
              </label>
              <label className="text-[11px] text-muted-foreground">
                Max names
                <input
                  type="number" min={1} max={100} step={1}
                  value={killDraft.maxNames}
                  onChange={(e) => setKillDraft((prev) => ({ ...prev, maxNames: num(e.target.value, prev.maxNames) }))}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-2 text-sm text-foreground"
                />
              </label>
              <label className="text-[11px] text-muted-foreground">
                Max sleeve %
                <input
                  type="number" min={1} max={100} step={1}
                  value={killDraft.maxSleevePct}
                  onChange={(e) => setKillDraft((prev) => ({ ...prev, maxSleevePct: num(e.target.value, prev.maxSleevePct) }))}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-2 text-sm text-foreground"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                placeholder={killLoosening || book.kills.globalHalt ? "Reason required to loosen risk / release halt" : "Kill-change reason (optional when tightening)"}
                className="w-full rounded border border-border bg-background px-2 py-2 text-sm text-foreground"
              />
              <button
                type="button"
                disabled={!killDirty}
                onClick={applyKillLimits}
                className="rounded border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-40"
              >
                Apply + log limits
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-3">
              <div className="rounded border border-border bg-background p-3">
                <span className="text-muted-foreground">Book equity</span>
                <div className="mt-1 font-mono text-lg">{marked.metrics.equity.toFixed(2)}</div>
              </div>
              <div className="rounded border border-border bg-background p-3">
                <span className="text-muted-foreground">Drawdown</span>
                <div className="mt-1 font-mono text-lg">{marked.metrics.drawdownPct.toFixed(2)}%</div>
              </div>
              <div className="rounded border border-border bg-background p-3">
                <span className="text-muted-foreground">Actual gross</span>
                <div className="mt-1 font-mono text-lg">{(marked.metrics.grossExposure * 100).toFixed(1)}%</div>
              </div>
              <div className="rounded border border-border bg-background p-3">
                <span className="text-muted-foreground">Names</span>
                <div className="mt-1 font-mono text-lg">{marked.metrics.activeNames}/{book.kills.maxNames}</div>
              </div>
              <div className="rounded border border-border bg-background p-3">
                <span className="text-muted-foreground">Realized P/L</span>
                <div className="mt-1 font-mono text-lg">{marked.metrics.realizedPnl >= 0 ? "+" : ""}{marked.metrics.realizedPnl.toFixed(2)}</div>
              </div>
              <div className="rounded border border-border bg-background p-3">
                <span className="text-muted-foreground">Unrealized P/L</span>
                <div className="mt-1 font-mono text-lg">{marked.metrics.unrealizedPnl >= 0 ? "+" : ""}{marked.metrics.unrealizedPnl.toFixed(2)}</div>
              </div>
            </div>

            {kills.reasons.length > 0 && (
              <ul className="mt-3 list-inside list-disc text-[12px] text-down">
                {kills.reasons.map((x) => <li key={x}>{x}</li>)}
              </ul>
            )}
          </div>
        </section>

        {flag && (
          <section className="rounded border border-border bg-surface p-5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{flag} checklist</p>
            <ul className="mt-3 grid gap-2 text-[12px] text-muted-foreground md:grid-cols-2">
              {CHECKLISTS[flag].map((item) => (
                <li key={item} className="rounded border border-border bg-background px-3 py-2">□ {item}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Paper book</p>
            <span className="text-[11px] text-muted-foreground">Normalized start NAV = 100 · simple simulated fills</span>
          </div>
          {marked.positions.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No paper positions yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Symbol</th>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Avg</th>
                    <th className="py-2 pr-3">Mark</th>
                    <th className="py-2 pr-3">Units</th>
                    <th className="py-2">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {marked.positions.map((p) => {
                    const pnl = p.units * (p.lastPrice - p.avgPrice);
                    return (
                      <tr key={p.symbol} className="border-t border-border/80">
                        <td className="py-2 pr-3 font-semibold">{p.symbol}</td>
                        <td className="py-2 pr-3 tabular">{pct(p.targetSleeve)}</td>
                        <td className="py-2 pr-3 tabular">{p.avgPrice.toFixed(4)}</td>
                        <td className="py-2 pr-3 tabular">{p.lastPrice.toFixed(4)}</td>
                        <td className="py-2 pr-3 tabular">{p.units.toFixed(6)}</td>
                        <td className={`py-2 tabular ${pnl < 0 ? "text-down" : pnl > 0 ? "text-up" : ""}`}>
                          {pnl >= 0 ? "+" : ""}{pnl.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Persistent ops log</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Browser-local · newest first · capped at 500 rows</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={exportCsv} disabled={!book.log.length} className="text-[11px] text-primary disabled:opacity-40">
                Export CSV
              </button>
              <Link to="/" className="text-[11px] text-primary hover:underline">← Back to Sniper</Link>
            </div>
          </div>
          {book.log.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Time UTC</th>
                    <th className="py-2 pr-3">Action</th>
                    <th className="py-2 pr-3">Sym</th>
                    <th className="py-2 pr-3">BTD</th>
                    <th className="py-2 pr-3">Flag</th>
                    <th className="py-2 pr-3">Suggested</th>
                    <th className="py-2 pr-3">Applied</th>
                    <th className="py-2 pr-3">Feed</th>
                    <th className="py-2">Reason / details</th>
                  </tr>
                </thead>
                <tbody>
                  {book.log.map((row) => (
                    <tr key={row.id} className="border-t border-border/80">
                      <td className="py-2 pr-3 tabular text-muted-foreground">{row.t.replace("T", " ").slice(0, 19)}Z</td>
                      <td className="py-2 pr-3">{row.action}</td>
                      <td className="py-2 pr-3 font-semibold">{row.symbol ?? "BOOK"}</td>
                      <td className="py-2 pr-3 tabular">{row.score === null ? "—" : row.score.toFixed(1)}</td>
                      <td className="py-2 pr-3 font-mono">{row.flag ?? "—"}</td>
                      <td className="py-2 pr-3 tabular">{row.suggestedSleeve === null ? "—" : pct(row.suggestedSleeve)}</td>
                      <td className="py-2 pr-3 tabular">{row.appliedSleeve === null ? "—" : pct(row.appliedSleeve)}</td>
                      <td className="py-2 pr-3">{row.feedState ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">{[row.reason, row.details].filter(Boolean).join(" · ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          ROE: score ≠ order · paper only · {BTD_FORMULA_ID} · not investment advice. Sergeant contains no live-broker order path.
        </footer>
      </div>
    </main>
  );
}
