import { Link } from "@tanstack/react-router";
import { ICONS, PixelIcon } from "@/components/btd/PixelIcon";

export function SniperHero() {
  return (
    <section aria-label="Sniper research desk" className="mil-panel overflow-hidden bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/theme/sniper/sniper_buddy.png" alt="RANGE Sniper companion" className="h-10 w-10 shrink-0 object-contain" width={40} height={40} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/90">RANGE · Sniper research desk</p>
            <h2 className="pixel-title text-xl leading-tight text-primary">Target acquisition</h2>
            <p className="text-xs text-muted-foreground">Research signals only. Score ≠ order. Paper first.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="#rankings" className="inline-flex items-center gap-2 border border-primary bg-primary px-3 py-2 text-xs font-bold uppercase text-primary-foreground"><PixelIcon name={ICONS.radar} className="pixel h-4 w-4" />View targets</a>
          <Link to="/sergeant" className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs font-bold uppercase text-muted-foreground hover:text-primary"><PixelIcon name={ICONS.sergeant} className="pixel h-4 w-4" />Paper desk</Link>
        </div>
      </div>
      <details className="border-t border-border">
        <summary className="cursor-pointer px-4 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Reference artwork · mockup, not live data</summary>
        <img src="/theme/mock-sniper-overview.png" alt="BTD Commando Sniper overview reference mockup" className="mx-auto max-h-[360px] w-full object-contain" width={768} height={316} />
      </details>
    </section>
  );
}
