import { Link } from "@tanstack/react-router";

export function SniperHero() {
  return (
    <section className="mil-panel relative overflow-hidden bg-surface">
      <div className="hero-sniper-art pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">Sniper · Overview</p>
          <h2 className="pixel-title mt-1 text-4xl leading-none text-primary sm:text-5xl">Sniper</h2>
          <p className="pixel-title mt-1 text-xl text-foreground">Target acquisition</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Scan markets with BTD Score (<span className="tabular text-foreground">btd_v1_0</span>).
            Research signals only — not orders. Sergeant handles paper risk.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="#rankings" className="inline-flex border-2 border-primary bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground">View targets →</a>
            <Link to="/sergeant" className="inline-flex border-2 border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-primary/60 hover:text-primary">Sergeant paper book</Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-1 text-[9px] font-bold uppercase">
            <span className="sig-stand px-1.5 py-0.5">Stand down</span>
            <span className="sig-track px-1.5 py-0.5">Track</span>
            <span className="sig-watch px-1.5 py-0.5">Watch</span>
            <span className="sig-hot px-1.5 py-0.5">Hot</span>
            <span className="sig-acquire px-1.5 py-0.5">Acquire</span>
          </div>
        </div>
        <img src="/theme/hero-sniper.png" alt="" className="pixel mx-auto h-40 w-auto border-2 border-primary/40 bg-black/30 object-contain sm:mx-0 sm:h-48" width={200} height={200} />
      </div>
    </section>
  );
}