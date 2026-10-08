import { COOLISH_LORE as L } from "@/lib/coolish-lore";

/** Public Paul Wei / coolish archive. Not a live Hunter signal. */
export function CoolishLore() {
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
      <p className="mt-2 text-xs text-muted-foreground">
        Window {L.window.from} → {L.window.to}. Separate from block recon, K-Whale, and the AOA panel.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
        {L.metrics.map((m) => (
          <div key={m.label} className="border border-border bg-background/40 p-3">
            <p className="text-muted-foreground">{m.label}</p>
            <p className="tabular font-semibold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-xs leading-relaxed text-muted-foreground">
        {L.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{L.disclaimer}</p>
      <div className="mt-3 flex flex-wrap gap-4">
        <a href={L.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
          Source: {L.sourceLabel} ↗
        </a>
        <a href={L.bitmexUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
          BitMEX Hall of Legends ↗
        </a>
      </div>
    </section>
  );
}
