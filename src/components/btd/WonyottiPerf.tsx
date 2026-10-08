import { WONYOTTI_PERF as P } from "@/lib/wonyotti-perf";

function pathOf(values: number[], w = 640, h = 148, pad = 10) {
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function Chart({ title, caption, values, endLabel }: { title: string; caption: string; values: number[]; endLabel: string }) {
  return (
    <div className="border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="tabular text-xs text-primary">{endLabel}</p>
      </div>
      <svg viewBox="0 0 640 148" className="h-36 w-full text-primary" role="img" aria-label={title}>
        <path d={pathOf(values)} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <p className="mt-1 text-[11px] text-muted-foreground">{caption}</p>
    </div>
  );
}

/** Research chart only. Forward bar engines failed. Not a live signal. */
export function WonyottiPerf() {
  const ident = P.identityCurve.map((p) => p.btc);
  const wallet = P.walletCurve.map((p) => p.btc);
  return (
    <section className="mil-panel p-5" aria-label="Wonyotti engine performance">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.25em] text-muted-foreground">Research chart · not a signal</p>
          <h2 className="mt-1 text-base font-extrabold uppercase tracking-wide text-foreground">Wonyotti engine performance</h2>
        </div>
        <span className="border border-down/50 bg-down/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-down">
          {P.status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Forward engines on hourly and 15-minute bars did not make money after costs. The curve that holds is the identity filter on his own XBTUSD fills: fade the 24h extreme, add at a worse price, maker fill, hold past a day.
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Chart
          title="Identity trades, cumulative proxy PnL"
          caption={`${P.identityTrades} XBTUSD round-trips. Attribution on his fills, not a forward test.`}
          values={ident}
          endLabel={`+${P.identityPnl.toFixed(1)} BTC`}
        />
        <Chart
          title="BitMEX aoa wallet balance"
          caption="XBT balance, includes deposits and withdrawals. Not the engine."
          values={wallet}
          endLabel={`${wallet[wallet.length - 1].toFixed(1)} BTC`}
        />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs">
        {P.forward.map((row) => (
          <div key={row.name} className="border border-border bg-background/40 p-3">
            <p className="text-muted-foreground">{row.name}</p>
            <p className="mt-1 font-semibold text-down">{row.result}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        15-minute preprocessing removed stacked phantom adds and still found no 2018-2019 rule with a positive average trade. Do not trade this. Not investment advice.
      </p>
    </section>
  );
}
