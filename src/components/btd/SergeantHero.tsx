import { Link } from "@tanstack/react-router";
import { ICONS, PixelIcon } from "@/components/btd/PixelIcon";

export function SergeantHero() {
  return (
    <section className="mil-panel overflow-hidden bg-surface p-0">
      <div className="grid">
        <div className="flex flex-col justify-center gap-2 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden border-2 border-primary bg-background">
              <img
                src="/theme/sergeant/sergeant_buddy.png"
                alt="SGT COMMAND Sergeant companion"
                className="h-full w-full object-contain object-center"
                loading="eager"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <PixelIcon name={ICONS.sergeant} className="pixel h-6 w-6" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">
                  Sergeant · Overview
                </p>
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                SGT COMMAND · paper discipline
              </p>
            </div>
          </div>
          <h2 className="pixel-title text-2xl leading-none text-primary">
            Paper command
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Plan · Execute · Log · Improve. Score ≠ order. No live brokers without L4+ OK.
          </p>
          <a
            href="#paper-book"
            className="inline-flex w-fit items-center gap-2 border-2 border-up bg-up/90 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground"
          >
            <PixelIcon name={ICONS.paperBook} className="pixel h-4 w-4" /> Open paper book
          </a>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary hover:underline"
          >
            <PixelIcon name={ICONS.target} className="pixel h-4 w-4" /> Sniper targets
          </Link>
        </div>
      </div>
      <details className="border-t border-border"><summary className="cursor-pointer px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">View full reference artwork (mockup, not live data)</summary>        <img
          src="/theme/mock-sergeant-overview.png"
          alt="BTD Commando Sergeant overview"
          className="mx-auto max-h-[360px] w-full object-contain"
          width={768}
          height={329}
        />
</details>
    </section>
  );
}
