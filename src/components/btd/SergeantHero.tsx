import { Link } from "@tanstack/react-router";

/** Panel 4 — Sergeant overview hero (mock board). */
export function SergeantHero() {
  return (
    <section className="mil-panel relative overflow-hidden">
      <div className="hero-sergeant-art absolute inset-0 opacity-85" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />

      <div className="relative grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] sm:items-center sm:p-8">
        <div className="flex justify-center sm:justify-start">
          <div className="relative h-40 w-full max-w-xs overflow-hidden border-2 border-primary/30 bg-black/25 sm:h-52">
            <img
              src="/theme/btd-sprite-sheet.png"
              alt=""
              className="pixel h-full w-full object-cover"
              style={{ objectPosition: "55% 12%" }}
              width={360}
              height={220}
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">
            4 · Sergeant · Overview
          </p>
          <h2 className="pixel-title mt-2 text-4xl leading-none text-primary sm:text-5xl">Sergeant</h2>
          <p className="pixel-title mt-1 text-xl text-foreground sm:text-2xl">Paper command</p>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Turn Sniper signals into a disciplined paper plan. Manage positions. Control risk. Keep
            the log. No live brokers without explicit L4+ authorization.
          </p>
          <ul className="mt-4 grid max-w-sm grid-cols-2 gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {["Plan", "Execute", "Log", "Improve"].map((s) => (
              <li
                key={s}
                className="flex items-center gap-2 border border-border/70 bg-surface-2/80 px-2 py-1.5"
              >
                <span className="text-primary">☑</span> {s}
              </li>
            ))}
          </ul>
          <a
            href="#paper-book"
            className="mt-6 inline-flex items-center gap-2 border-2 border-up bg-up/90 px-4 py-2.5 font-sans text-xs font-extrabold uppercase tracking-widest text-primary-foreground hover:brightness-110"
          >
            Open paper book →
          </a>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Or stay on this desk — the book is the board below.
          </p>
          <Link
            to="/"
            className="mt-2 inline-block text-[11px] font-bold uppercase tracking-wider text-primary hover:underline"
          >
            ← Back to Sniper targets
          </Link>
        </div>
      </div>
    </section>
  );
}
