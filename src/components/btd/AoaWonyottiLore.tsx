import { AOA_WONYOTTI_LORE as L } from "@/lib/aoa-wonyotti-lore";

/** Public third-party AOA/워뇨띠 lore. Not live Hunter signal, not BTD alpha. */
export function AoaWonyottiLore() {
  return (
    <section className="mil-panel p-5" aria-label="AOA Wonyotti research lore">
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
        Window {L.window.from} → {L.window.to}. Venue note: {L.venue}. Separate from confirmed-block recon and from rejected K-Whale research above.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
        {L.metrics.map((m) => (
          <div key={m.label} className="border border-border bg-background/40 p-3">
            <p className="text-muted-foreground">{m.label}</p>
            <p className="tabular font-semibold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
      <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-foreground">Three principles (analyst frame)</h3>
      <ol className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {L.principles.map((p) => (
          <li key={p.n} className="border border-border/60 bg-background/30 p-3">
            <p className="font-semibold text-foreground">
              {p.n}. {p.title}
            </p>
            <p className="mt-1">{p.body}</p>
          </li>
        ))}
      </ol>
      <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-foreground">Where the frame broke</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        {L.failures.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{L.disclaimer}</p>
      <a href={L.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-primary underline">
        Source: {L.sourceLabel} ↗
      </a>
    </section>
  );
}
