import { Link } from "@tanstack/react-router";
export function SniperHero() {
  return (
    <section className="mil-panel overflow-hidden bg-surface p-0">
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <img src="/theme/mock-sniper-overview.png" alt="BTD Commando Sniper overview" className="h-full min-h-[220px] w-full object-cover object-left" width={768} height={316} />
        <div className="flex flex-col justify-center gap-3 border-t border-border p-5 lg:border-l lg:border-t-0 lg:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">Sniper · Overview</p>
          <h2 className="pixel-title text-3xl leading-none text-primary sm:text-4xl">Target acquisition</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">Scan markets with BTD Score (<span className="tabular text-foreground">btd_v1_0</span>). Research signals only — not orders.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a href="#rankings" className="inline-flex border-2 border-primary bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground">View targets →</a>
            <Link to="/sergeant" className="inline-flex border-2 border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-primary/60 hover:text-primary">Sergeant</Link>
          </div>
        </div>
      </div>
    </section>
  );
}