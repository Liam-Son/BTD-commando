import { Link } from "@tanstack/react-router";

/** Panel 1 — Sniper overview hero (mock board). */
export function SniperHero() {
  return (
    <section className="mil-panel relative overflow-hidden">
      <div className="hero-sniper-art absolute inset-0 opacity-90" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/20" />

      <div className="relative grid gap-6 p-5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:items-center sm:p-8 lg:p-10">
        <div className="order-2 sm:order-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">
            1 · Sniper · Overview
          </p>
          <h2 className="pixel-title mt-2 text-4xl leading-none text-primary sm:text-5xl lg:text-6xl">
            Sniper
          </h2>
          <p className="pixel-title mt-1 text-xl text-foreground sm:text-2xl">Target acquisition</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Scan global markets with BTD Score (
            <span className="tabular text-foreground">btd_v1_0</span>). Find opportunities. Let
            Sergeant handle paper risk. Scores are research signals — not orders.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#rankings"
              className="inline-flex items-center gap-2 border-2 border-primary bg-primary px-4 py-2.5 font-sans text-xs font-extrabold uppercase tracking-widest text-primary-foreground hover:brightness-110"
            >
              View targets →
            </a>
            <Link
              to="/sergeant"
              className="inline-flex items-center gap-2 border-2 border-border bg-surface/80 px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-primary/60 hover:text-primary"
            >
              Sergeant paper book
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5 text-[9px] font-bold uppercase tracking-wide">
            <span className="sig-stand px-1.5 py-0.5">0–24 Stand down</span>
            <span className="sig-track px-1.5 py-0.5">25–49 Track</span>
            <span className="sig-watch px-1.5 py-0.5">50–74 Watch</span>
            <span className="sig-hot px-1.5 py-0.5">75–89 Hot</span>
            <span className="sig-acquire px-1.5 py-0.5">90–100 Acquire</span>
          </div>
        </div>

        {/* Decorative crop — sniper silhouette from original sheet */}
        <div className="order-1 flex justify-center sm:order-2 sm:justify-end">
          <div className="relative h-44 w-full max-w-sm overflow-hidden border-2 border-primary/30 bg-black/20 sm:h-56 lg:h-64">
            <img
              src="/theme/btd-sprite-sheet.png"
              alt=""
              className="pixel h-full w-full object-cover object-left"
              style={{ objectPosition: "12% 18%" }}
              width={420}
              height={260}
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
