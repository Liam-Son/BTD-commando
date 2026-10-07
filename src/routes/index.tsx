import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fmtPct, ratingFor, type RankedAsset } from "@/lib/btd-core";
import { useLiveRankings, LIVE_MS } from "@/hooks/useLiveRankings";
import { useAuth } from "@/hooks/useAuth";
import { LivePulseChart } from "@/components/btd/LivePulseChart";
import { FearPanel } from "@/components/btd/FearPanel";
import { RankingsTable } from "@/components/btd/RankingsTable";
import { RatingBadge } from "@/components/btd/RatingBadge";
import { BacktestChart } from "@/components/btd/BacktestChart";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { SniperHero } from "@/components/btd/SniperHero";
import { MarketRadar } from "@/components/btd/MarketRadar";
import { IntelSection } from "@/components/btd/IntelSection";
import { DataStatus, type DataStatusState } from "@/components/btd/DataStatus";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BTD Commando — Sniper board · Live Buy-the-Dip Rankings" },
      {
        name: "description",
        content:
          "Live BTD Score rankings across US stocks, crypto, ETFs, commodities and indices. Fear, drawdown, momentum and risk engines refreshed every 5 minutes.",
      },
      { property: "og:title", content: "BTD Commando — Sniper scores the dip" },
      {
        property: "og:description",
        content:
          "Top 30 global buying opportunities scored 0-100 on fear, drawdown, momentum, mean reversion, trend quality and risk.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://btd.noviark.net/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://btd.noviark.net/" }],
  }),
  component: Terminal,
});

const REFRESH_MS = 5 * 60 * 1000;

/** Counts down to the next 60-second live price tick. */
function LiveCountdown({ updatedAt }: { updatedAt: number }) {
  const [left, setLeft] = useState(LIVE_MS);
  useEffect(() => {
    const target = updatedAt + LIVE_MS;
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [updatedAt]);
  return <span className="tabular">{String(Math.ceil(left / 1000)).padStart(2, "0")}s</span>;
}

function Countdown({ updatedAt }: { updatedAt: string }) {
  const [left, setLeft] = useState(REFRESH_MS);
  useEffect(() => {
    const target = new Date(updatedAt).getTime() + REFRESH_MS;
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [updatedAt]);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span className="tabular">
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

function Ticker({ assets }: { assets: RankedAsset[] }) {
  const items = assets.slice(0, 24);
  return (
    <div className="overflow-hidden border-y border-border bg-surface">
      <div className="ticker-track py-1.5">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0">
            {items.map((a) => (
              <span
                key={`${dup}-${a.symbol}`}
                className="tabular flex items-center gap-2 whitespace-nowrap px-4 text-[11px]"
              >
                <span className="font-semibold">{a.symbol}</span>
                <span className={a.changeDay >= 0 ? "text-up" : "text-down"}>
                  {fmtPct(a.changeDay)}
                </span>
                <span className="text-muted-foreground">BTD {a.btdScore.toFixed(1)}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded-sm bg-surface-2"
          style={{ opacity: 1 - i * 0.06 }}
        />
      ))}
    </div>
  );
}

function Terminal() {
  const { data, pulse, isPending, error, liveUpdatedAt, isLive, isRefreshingLive, refetch } =
    useLiveRankings();
  const { user } = useAuth();
  const [selectedIntelCategory, setSelectedIntelCategory] = useState("all");

  // Google sign-in returns to the site root; forward to the saved destination.
  const navigate = Route.useNavigate();
  useEffect(() => {
    if (!user) return;
    const target = sessionStorage.getItem("btd:after-auth");
    if (target && target.startsWith("/")) {
      sessionStorage.removeItem("btd:after-auth");
      navigate({ to: target });
    }
  }, [user, navigate]);

  const top = data?.assets[0];
  const dataState: DataStatusState = isPending
    ? "loading"
    : error
      ? "offline"
      : !data?.assets.length
        ? "empty"
        : isLive
          ? "live"
          : "snapshot";

  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader
        active="sniper"
        signedIn={!!user}
        status={
          <>
            <span className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${isRefreshingLive ? "live-dot bg-warn" : isLive ? "bg-up" : "bg-muted-foreground"}`}
              />
              {isRefreshingLive ? "Repricing" : "Live prices"}
            </span>
            <span>
              Next tick <LiveCountdown updatedAt={liveUpdatedAt || Date.now()} />
            </span>
            {data && (
              <span className="hidden lg:inline">
                Full cycle <Countdown updatedAt={data.updatedAt} />
              </span>
            )}
          </>
        }
      />

      <div className="mx-auto max-w-[1600px] px-4 pt-4">
        <DataStatus
          state={dataState}
          detail={
            dataState === "offline"
              ? "The ranking source did not return a usable snapshot. No score is being presented as current."
              : dataState === "empty"
                ? "The ranking source responded without assets. This is an empty feed, not a zero-score market."
                : dataState === "loading"
                  ? "Waiting for the first verified ranking snapshot."
                  : `${data?.assets.length ?? 0} assets available for research-only ranking.`
          }
          updatedAt={data?.updatedAt ?? liveUpdatedAt}
          sources="Yahoo Finance · CoinGecko · alternative.me"
          onRetry={() => void refetch()}
        />
      </div>

      <section className="mx-auto max-w-[1600px] px-4 pt-4">
        <div className="rounded border border-primary/30 bg-surface p-4">
          <p className="text-[10px] font-bold uppercase tracking-[.25em] text-primary">Sergeant · your computer</p>
          <h2 className="mt-1 text-lg font-bold text-foreground">How to turn Sergeant on and off</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>
              Open the <Link to="/sergeant" className="text-primary">paper desk</Link>. The switch above the chat starts on <strong className="text-foreground">Off</strong>. Off is Corporal. It only explains the paper desk. It does not place orders.
            </li>
            <li>
              On your own computer, download the source from GitHub and leave this window open. Use a folder that actually exists. <code className="text-foreground">path\to\your\quant\folder</code> is not a real folder.
              <pre className="mt-2 overflow-auto rounded border border-border bg-background p-3 text-xs text-foreground">{`cd tools\\sergeant-local
python sergeant_local.py --serve --project C:\\Users\\YOU\\BTD-commando`}</pre>
            </li>
            <li>
              Click <strong className="text-foreground">On</strong>. The badge should say <span className="text-foreground">Sergeant on · this computer</span>. That program listens only on this PC, at <span className="text-foreground">127.0.0.1:8765</span>.
            </li>
            <li>
              Click <strong className="text-foreground">Off</strong>, or press Ctrl+C in that window, to turn Sergeant off. The choice is saved in this browser only. Another computer has its own switch.
            </li>
          </ol>
        </div>
      </section>

      {data && <Ticker assets={data.assets} />}

      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6">
        <SniperHero />
        {error && (
          <div className="rounded border border-down/40 bg-down/10 px-4 py-3 text-sm text-down">
            Market data feed unavailable. Retrying on the next 5-minute cycle.
          </div>
        )}

        {isPending ? (
          <div className="rounded border border-border bg-surface">
            <Skeleton />
          </div>
        ) : data ? (
          <section id="rankings">
            <RankingsTable
              assets={data.assets}
              updatedAt={new Date(liveUpdatedAt || Date.now()).toISOString()}
            />
          </section>
        ) : null}

        {data && (
          <MarketRadar
            assets={data.assets}
            updatedAt={new Date(liveUpdatedAt || Date.now()).toISOString()}
          />
        )}
        <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="mil-panel p-6">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Methodology
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight">
              Is this a statistically attractive time to buy the dip?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              BTD Index™ v1.0 scores every asset as{" "}
              <span className="tabular text-foreground">0.40V + 0.25M + 0.20F + 0.10Q + 0.05R</span>{" "}
              — peer-relative valuation (P/E, P/B percentiles), oversold momentum (RSI 14), market
              fear (Fear &amp; Greed, VIX), balance-sheet quality (ROE, debt-to-equity) and risk
              (beta) — each normalized to 0–100.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ["Valuation", "40%"],
                ["Momentum", "25%"],
                ["Fear", "20%"],
                ["Quality", "10%"],
                ["Risk", "5%"],
              ].map(([f, w]) => (
                <span
                  key={f}
                  className="rounded-sm border border-border bg-surface-2 px-2 py-1 text-[11px] text-muted-foreground"
                >
                  {f} <span className="tabular text-primary">{w}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mil-panel p-6">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Market radar · top target
            </p>
            {top ? (
              <>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-2xl font-bold leading-tight">{top.name}</p>
                    <p className="tabular text-xs text-muted-foreground">
                      {top.symbol} · {top.assetClass} · {top.country}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-4xl font-bold text-primary">
                      {top.btdScore.toFixed(1)}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Research rating · {ratingFor(top.btdScore).label}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded border border-border bg-border">
                  {[
                    ["1D", top.changeDay],
                    ["1W", top.changeWeek],
                    ["1M", top.changeMonth],
                  ].map(([label, v]) => (
                    <div key={String(label)} className="bg-surface-2 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {label}
                      </p>
                      <p
                        className={`tabular text-sm font-semibold ${(v as number) >= 0 ? "text-up" : "text-down"}`}
                      >
                        {fmtPct(v as number)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <RatingBadge score={top.btdScore} />
                  <span className="tabular">
                    {top.drawdown.toFixed(1)}% from 52w high · {top.confidence}% input reliability
                  </span>
                </div>
              </>
            ) : dataState === "loading" ? (
              <div className="mt-4 h-32 animate-pulse rounded-sm bg-surface-2" />
            ) : (
              <div className="mt-4 border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
                {dataState === "offline"
                  ? "Top target unavailable because the ranking feed is offline."
                  : "No top target is available in the current snapshot."}
              </div>
            )}
          </div>
        </section>

        <details className="mil-panel">
          <summary className="cursor-pointer p-3 text-xs font-bold uppercase text-primary">
            Field reference library · weather and defense
          </summary>
          <IntelSection
            activeCategory={selectedIntelCategory}
            onSelectCategory={setSelectedIntelCategory}
          />
        </details>

        {data && <FearPanel fear={data.fear} assetCount={data.assets.length} />}

        <LivePulseChart pulse={pulse} isLive={isLive} assetCount={data?.assets.length ?? 0} />

        <BacktestChart />

        {data && data.degraded.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Partial coverage this cycle: {data.degraded.join(", ")}
          </p>
        )}

        <footer className="border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          BTD Commando · Sniper board — data from CoinGecko, Yahoo Finance and alternative.me.
          Scores are quantitative research signals and never a guarantee of future returns. Not
          investment advice.
        </footer>
      </div>
    </main>
  );
}
