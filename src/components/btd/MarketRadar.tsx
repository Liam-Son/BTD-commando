import type { RankedAsset } from "@/lib/btd-core";
import { milSignalFor } from "@/components/btd/RatingBadge";

type Props = {
  assets: RankedAsset[];
  updatedAt?: string;
};

/**
 * Panel 2 — Market radar strip: class mix + top-5 signal table (mock board).
 * Full Top-30 still lives in RankingsTable below.
 */
export function MarketRadar({ assets, updatedAt }: Props) {
  const counts = {
    ALL: assets.length,
    US: assets.filter((a) => a.country === "US" || a.country === "United States").length,
    CRYPTO: assets.filter((a) => a.assetClass === "Crypto").length,
    ETF: assets.filter((a) => a.assetClass === "ETF").length,
    COMMODITY: assets.filter((a) => a.assetClass === "Commodity").length,
    GLOBAL: assets.filter((a) => a.country !== "US" && a.country !== "United States").length,
  };

  const top = assets.slice(0, 5);
  const time =
    updatedAt && !Number.isNaN(Date.parse(updatedAt))
      ? new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "—";

  return (
    <section className="mil-panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary/80">
            2 · Sniper · Dashboard
          </p>
          <h2 className="pixel-title mt-1 text-2xl text-primary sm:text-3xl">Market radar</h2>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Last update <span className="tabular text-foreground">{time}</span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* Simple radial-ish count board (CSS, no third-party chart IP) */}
        <div className="relative flex aspect-square max-h-[220px] items-center justify-center border-2 border-up/40 bg-black/40">
          <div
            className="absolute inset-3 rounded-full border border-up/30"
            style={{
              background:
                "repeating-radial-gradient(circle at center, transparent 0 12px, oklch(0.55 0.15 145 / 0.12) 12px 13px)",
            }}
          />
          <div className="relative z-10 text-center">
            <p className="pixel-title text-4xl text-up">{counts.ALL}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Universe</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
            {(
              [
                ["ALL", counts.ALL],
                ["US", counts.US],
                ["CRYPTO", counts.CRYPTO],
                ["ETF", counts.ETF],
                ["COMMODITY", counts.COMMODITY],
                ["GLOBAL", counts.GLOBAL],
              ] as const
            ).map(([k, v]) => (
              <span
                key={k}
                className="border border-border bg-surface-2 px-2 py-1 text-muted-foreground"
              >
                {k} <span className="tabular text-primary">{v}</span>
              </span>
            ))}
          </div>

          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead className="bg-surface-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Symbol</th>
                  <th className="px-2 py-2 text-right">Price</th>
                  <th className="px-2 py-2 text-right">BTD</th>
                  <th className="px-2 py-2">Signal</th>
                </tr>
              </thead>
              <tbody>
                {top.map((a, i) => {
                  const sig = milSignalFor(a.btdScore);
                  return (
                    <tr key={a.symbol} className="border-t border-border/70 hover:bg-primary/5">
                      <td className="tabular px-2 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-2 py-2 font-bold">{a.symbol}</td>
                      <td className="tabular px-2 py-2 text-right">
                        {a.price >= 1 ? a.price.toFixed(2) : a.price.toPrecision(3)}
                      </td>
                      <td className="tabular px-2 py-2 text-right font-bold text-primary">
                        {a.btdScore.toFixed(0)}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={
                            sig === "ACQUIRE"
                              ? "sig-acquire px-1.5 py-0.5 text-[9px]"
                              : sig === "HOT"
                                ? "sig-hot px-1.5 py-0.5 text-[9px]"
                                : sig === "WATCH"
                                  ? "sig-watch px-1.5 py-0.5 text-[9px]"
                                  : sig === "TRACK"
                                    ? "sig-track px-1.5 py-0.5 text-[9px]"
                                    : "sig-stand px-1.5 py-0.5 text-[9px]"
                          }
                        >
                          {sig}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Full board below · signals are research labels, not trade orders.
          </p>
        </div>
      </div>
    </section>
  );
}
