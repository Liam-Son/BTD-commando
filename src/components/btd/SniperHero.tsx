import { Link } from "@tanstack/react-router";

/** Soft-pixel Sniper overview strip — original theme art only. */
export function SniperHero() {
  return (
    <section className="mil-panel relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "url(/theme/btd-sprite-sheet.png)",
          backgroundSize: "cover",
          backgroundPosition: "70% 15%",
          imageRendering: "pixelated",
        }}
        aria-hidden
      />
      <div className="relative grid gap-4 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
        <img
          src="/theme/btd-sprite-sheet.png"
          alt=""
          className="pixel mx-auto h-28 w-28 object-cover sm:mx-0 sm:h-36 sm:w-36"
          style={{ objectPosition: "6% 12%" }}
          width={144}
          height={144}
        />
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80">Sniper · Overview</p>
          <h2 className="pixel-title mt-1 text-3xl text-primary sm:text-4xl">
            Sniper
            <span className="mt-1 block text-xl text-foreground sm:text-2xl">Target acquisition</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Scan markets with BTD Score (<span className="tabular text-foreground">btd_v1_0</span>).
            Find opportunities. Let Sergeant handle paper risk. Scores are research signals — not
            orders.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="#rankings"
              className="inline-flex items-center border-2 border-primary bg-primary px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
            >
              View targets →
            </a>
            <Link
              to="/sergeant"
              className="inline-flex items-center border-2 border-border bg-surface-2 px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              Sergeant paper book
            </Link>
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            Signal legend:{" "}
            <span className="sig-acquire mx-0.5 px-1">Acquire 90+</span>
            <span className="sig-hot mx-0.5 px-1">Hot 75–89</span>
            <span className="sig-watch mx-0.5 px-1">Watch 50–74</span>
            <span className="sig-track mx-0.5 px-1">Track 25–49</span>
            <span className="sig-stand mx-0.5 px-1">Stand down 0–24</span>
          </p>
        </div>
      </div>
    </section>
  );
}
