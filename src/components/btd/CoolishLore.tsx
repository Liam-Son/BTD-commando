import { COOLISH_LORE as L } from "@/lib/coolish-lore";

function linePath(values: number[], w = 640, h = 150, pad = 12) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function Bars({ rows, max, suffix }: { rows: { label: string; v: number }[]; max: number; suffix: string }) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[4.5rem_1fr_3.4rem] items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">{r.label}</span>
          <span className="h-2 bg-border/70">
            <span className="block h-2 bg-primary" style={{ width: `${Math.max(2, (r.v / max) * 100)}%` }} />
          </span>
          <span className="tabular text-right text-foreground">{r.v}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

/** Public Paul Wei / coolish archive visuals. Not a live Hunter signal. */
export function CoolishLore() {
  const mults = L.curve.map((p) => p.mult);
  return (
    <section className="mil-panel p-5" aria-label="Paul Wei coolish research lore">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.25em] text-muted-foreground">Named-trader archive · education</p>
          <h2 className="mt-1 text-base font-extrabold uppercase tracking-wide text-foreground">{L.title}</h2>
        </div>
        <span className="border border-border bg-surface-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {L.status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{L.headline}</p>
      <p className="mt-2 text-xs text-muted-foreground">Window {L.window.from} → {L.window.to}. Separate from block recon and the AOA panel.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
        {L.metrics.map((m) => (
          <div key={m.label} className="border border-border bg-background/40 p-3">
            <p className="text-muted-foreground">{m.label}</p>
            <p className="tabular font-semibold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 border border-border bg-background/40 p-3">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold text-foreground">Adjusted wealth multiple</p>
          <p className="tabular text-xs text-primary">1.0x → 54.1x</p>
        </div>
        <svg viewBox="0 0 640 150" className="h-36 w-full text-primary" role="img" aria-label="Coolish adjusted wealth multiple">
          <path d={linePath(mults)} fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{L.curve[0].date}</span>
          <span>2021 jump 4.6x to 25x</span>
          <span>{L.curve[L.curve.length - 1].date}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="border border-border bg-background/40 p-3">
          <p className="mb-3 text-xs font-semibold text-foreground">Year-end multiple</p>
          <Bars rows={L.years.map((y) => ({ label: y.y, v: y.v }))} max={Math.max(...L.years.map((y) => y.v))} suffix="x" />
        </div>
        <div className="border border-border bg-background/40 p-3">
          <p className="mb-3 text-xs font-semibold text-foreground">BTC share of notional</p>
          <Bars rows={L.btcShare.map((b) => ({ label: b.label, v: b.v }))} max={100} suffix="%" />
        </div>
        <div className="border border-border bg-background/40 p-3">
          <p className="mb-3 text-xs font-semibold text-foreground">Ledger events</p>
          <Bars rows={L.events.map((e) => ({ label: e.label, v: e.v }))} max={Math.max(...L.events.map((e) => e.v))} suffix="" />
        </div>
        <div className="border border-border bg-background/40 p-3">
          <p className="mb-3 text-xs font-semibold text-foreground">Cash in vs cash out</p>
          <Bars rows={L.flows.map((f) => ({ label: f.label, v: f.v }))} max={Math.max(...L.flows.map((f) => f.v))} suffix="" />
          <p className="mt-2 text-[11px] text-muted-foreground">XBT. Withdrawals dwarf the 1.77 deposit.</p>
        </div>
      </div>

      <ul className="mt-4 list-disc space-y-2 pl-5 text-xs leading-relaxed text-muted-foreground">
        {L.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{L.disclaimer}</p>
      <div className="mt-3 flex flex-wrap gap-4">
        <a href={L.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Source: {L.sourceLabel} ↗</a>
        <a href={L.bitmexUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">BitMEX Hall of Legends ↗</a>
      </div>
    </section>
  );
}
