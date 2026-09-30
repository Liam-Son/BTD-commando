import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ratingFor } from "@/lib/btd-core";
import { useLiveRankings } from "@/hooks/useLiveRankings";
import { useAuth } from "@/hooks/useAuth";
import { CommandoHeader } from "@/components/btd/CommandoHeader";

export const Route = createFileRoute("/sergeant")({
  head: () => ({
    meta: [
      { title: "Sergeant — Paper discipline | BTD Commando" },
      {
        name: "description",
        content:
          "BTD Commando Sergeant: paper risk posture from Sniper BTD scores. Score ≠ order. Research only.",
      },
    ],
  }),
  component: SergeantPage,
});

type Flag = "ACQUIRE" | "WATCH" | "REDUCE" | "STAND DOWN";

function flagFromScore(s: number): Flag {
  if (s >= 65) return "ACQUIRE";
  if (s >= 50) return "WATCH";
  if (s > 35) return "REDUCE";
  return "STAND DOWN";
}

function sleeveFromFlag(f: Flag): number {
  switch (f) {
    case "ACQUIRE":
      return 1;
    case "WATCH":
      return 0.5;
    case "REDUCE":
      return 0.25;
    default:
      return 0.1;
  }
}

type LogRow = {
  t: string;
  symbol: string;
  score: number;
  flag: Flag;
  sleeve: number;
};

function SergeantPage() {
  const { data, isPending, error, isLive, isRefreshingLive } = useLiveRankings();
  const { user } = useAuth();
  const [log, setLog] = useState<LogRow[]>([]);
  const [pick, setPick] = useState<string>("");

  const assets = data?.assets ?? [];
  const selected = useMemo(() => {
    if (!assets.length) return null;
    const bySym = pick ? assets.find((a) => a.symbol === pick) : null;
    return bySym ?? assets[0];
  }, [assets, pick]);

  const flag = selected ? flagFromScore(selected.btdScore) : null;
  const sleeve = flag ? sleeveFromFlag(flag) : 0;

  function logIntel() {
    if (!selected || !flag) return;
    setLog((prev) =>
      [
        {
          t: new Date().toISOString(),
          symbol: selected.symbol,
          score: selected.btdScore,
          flag,
          sleeve,
        },
        ...prev,
      ].slice(0, 40),
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader
        active="sergeant"
        signedIn={!!user}
        status={
          <span className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${isRefreshingLive ? "bg-warn" : isLive ? "bg-up" : "bg-muted-foreground"}`}
            />
            Paper desk
          </span>
        }
      />

      <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6">
        <section className="rounded border border-border bg-surface p-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            BTD Commando · Sergeant / SGT
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Paper discipline desk</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Sergeant turns <span className="text-foreground">Sniper</span> intel into a{" "}
            <span className="text-foreground">suggested paper sleeve</span> and a local ops log.
            No broker orders. No live capital. ROE: <span className="text-foreground">score ≠ order</span>.
            Doctrine:{" "}
            <a
              className="underline decoration-border underline-offset-2 hover:text-foreground"
              href="https://github.com/Liam-Son/BTD-index/blob/main/docs/COMMANDO_DOCTRINE.md"
              target="_blank"
              rel="noreferrer"
            >
              COMMANDO_DOCTRINE.md
            </a>
            .
          </p>
        </section>

        {error && (
          <div className="rounded border border-down/40 bg-down/10 px-4 py-3 text-sm text-down">
            Sniper feed unavailable — Sergeant stands by.
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="rounded border border-border bg-surface p-5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Intel intake (from Sniper)
            </p>
            {isPending || !selected ? (
              <div className="mt-4 h-28 animate-pulse rounded-sm bg-surface-2" />
            ) : (
              <>
                <label className="mt-3 block text-[11px] text-muted-foreground">
                  Symbol
                  <select
                    className="mt-1 w-full rounded border border-border bg-background px-2 py-2 text-sm text-foreground"
                    value={selected.symbol}
                    onChange={(e) => setPick(e.target.value)}
                  >
                    {assets.slice(0, 80).map((a) => (
                      <option key={a.symbol} value={a.symbol}>
                        {a.symbol} — BTD {a.btdScore.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.symbol} · {selected.assetClass}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-3xl font-bold text-primary">
                      {selected.btdScore.toFixed(1)}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {ratingFor(selected.btdScore).label}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded border border-border bg-surface p-5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Sergeant suggestion (paper only)
            </p>
            {flag ? (
              <>
                <p className="mt-3 font-mono text-2xl font-bold tracking-widest text-primary">
                  {flag}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Suggested unit book sleeve:{" "}
                  <span className="tabular font-semibold text-foreground">
                    {(sleeve * 100).toFixed(0)}%
                  </span>
                </p>
                <ul className="mt-3 list-inside list-disc text-[12px] text-muted-foreground">
                  <li>≥65 ACQUIRE → 100%</li>
                  <li>50–65 WATCH → 50%</li>
                  <li>35–50 REDUCE → 25%</li>
                  <li>≤35 STAND DOWN → 10%</li>
                </ul>
                <button
                  type="button"
                  onClick={logIntel}
                  className="mt-4 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Log paper posture
                </button>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Log is local to this browser session — not a broker ticket.
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Waiting on Sniper feed…</p>
            )}
          </div>
        </section>

        <section className="rounded border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Ops log (session)
            </p>
            <Link to="/" className="text-[11px] text-primary hover:underline">
              ← Back to Sniper board
            </Link>
          </div>
          {log.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Time (UTC)</th>
                    <th className="py-2 pr-3">Sym</th>
                    <th className="py-2 pr-3">BTD</th>
                    <th className="py-2 pr-3">Flag</th>
                    <th className="py-2">Sleeve</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((row, i) => (
                    <tr key={i} className="border-t border-border/80">
                      <td className="py-2 pr-3 tabular text-muted-foreground">
                        {row.t.replace("T", " ").slice(0, 19)}Z
                      </td>
                      <td className="py-2 pr-3 font-semibold">{row.symbol}</td>
                      <td className="py-2 pr-3 tabular">{row.score.toFixed(1)}</td>
                      <td className="py-2 pr-3 font-mono">{row.flag}</td>
                      <td className="py-2 tabular">{(row.sleeve * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          BTD Commando · Sergeant — paper discipline only. Not investment advice. Sniper scores are
          research signals; Sergeant does not place live orders.
        </footer>
      </div>
    </main>
  );
}
