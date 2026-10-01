import { Link } from "@tanstack/react-router";
import { ICONS, PixelIcon } from "@/components/btd/PixelIcon";

export function SergeantHero() {
  return (
    <section className="mil-panel overflow-hidden bg-surface p-0">
      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <img src="/theme/mock-sergeant-overview.png" alt="BTD Commando Sergeant overview" className="h-full min-h-[240px] w-full object-cover object-left" width={768} height={329} />
        <div className="flex flex-col justify-center gap-3 border-t border-border p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div className="flex items-center gap-2">
            <PixelIcon name={ICONS.sergeant} className="pixel h-8 w-8" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">Sergeant · Overview</p>
          </div>
          <h2 className="pixel-title text-3xl leading-none text-primary sm:text-4xl">Paper command</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">Plan · Execute · Log · Improve. Score ≠ order. No live brokers without L4+ OK.</p>
          <a href="#paper-book" className="inline-flex w-fit items-center gap-2 border-2 border-up bg-up/90 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground">
            <PixelIcon name={ICONS.paperBook} className="pixel h-4 w-4" /> Open paper book
          </a>
          <Link to="/" className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary hover:underline">
            <PixelIcon name={ICONS.target} className="pixel h-4 w-4" /> Sniper targets
          </Link>
        </div>
      </div>
    </section>
  );
}