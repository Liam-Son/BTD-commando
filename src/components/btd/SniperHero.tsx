import { Link } from "@tanstack/react-router";
import { ICONS, PixelIcon } from "@/components/btd/PixelIcon";

export function SniperHero() {
  return (
    <section className="mil-panel overflow-hidden bg-surface p-0">
      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <img src="/theme/mock-sniper-overview.png" alt="BTD Commando Sniper overview" className="h-full min-h-[240px] w-full object-cover object-left" width={768} height={316} />
        <div className="flex flex-col justify-center gap-3 border-t border-border p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div className="flex items-center gap-2">
            <PixelIcon name={ICONS.target} className="pixel h-8 w-8" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">Sniper · Overview</p>
          </div>
          <h2 className="pixel-title text-3xl leading-none text-primary sm:text-4xl">Target acquisition</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Scan markets with BTD Score (<span className="tabular text-foreground">btd_v1_0</span>). Research signals only — not orders.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="#rankings" className="inline-flex items-center gap-2 border-2 border-primary bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground">
              <PixelIcon name={ICONS.radar} className="pixel h-4 w-4" /> View targets
            </a>
            <Link to="/sergeant" className="inline-flex items-center gap-2 border-2 border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-primary/60 hover:text-primary">
              <PixelIcon name={ICONS.sergeant} className="pixel h-4 w-4" /> Sergeant
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <img src={`/theme/icons/${ICONS.standDown}`} alt="" className="pixel h-6 w-6" />
            <img src={`/theme/icons/${ICONS.watch}`} alt="" className="pixel h-6 w-6" />
            <img src={`/theme/icons/${ICONS.acquire}`} alt="" className="pixel h-6 w-6" />
          </div>
        </div>
      </div>
    </section>
  );
}