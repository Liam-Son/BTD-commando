import { Link } from "@tanstack/react-router";

export function SergeantHero() {
  return (
    <section className="mil-panel relative overflow-hidden bg-surface">
      <div className="hero-sergeant-art pointer-events-none absolute inset-0 opacity-35" aria-hidden />
      <div className="relative grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-7">
        <img src="/theme/hero-sergeant.png" alt="" className="pixel mx-auto h-40 w-auto border-2 border-primary/40 bg-black/30 object-contain sm:mx-0 sm:h-48" width={200} height={200} />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">Sergeant · Overview</p>
          <h2 className="pixel-title mt-1 text-4xl leading-none text-primary sm:text-5xl">Sergeant</h2>
          <p className="pixel-title mt-1 text-xl text-foreground">Paper command</p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Turn Sniper signals into a disciplined paper plan. No live brokers without explicit L4+ OK.
          </p>
          <a href="#paper-book" className="mt-5 inline-flex border-2 border-up bg-up/90 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground">Open paper book →</a>
          <div className="mt-3">
            <Link to="/" className="text-[11px] font-bold uppercase tracking-wider text-primary hover:underline">← Sniper targets</Link>
          </div>
        </div>
      </div>
    </section>
  );
}