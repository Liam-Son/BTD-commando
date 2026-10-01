import { createFileRoute, Link } from "@tanstack/react-router";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { ICONS, PixelIcon } from "@/components/btd/PixelIcon";
import { useAuth } from "@/hooks/useAuth";
export const Route = createFileRoute("/armory")({
  head: () => ({ meta: [{ title: "Armory | BTD Commando" }, { name: "description", content: "BTD Armory — full UI packs + pixel icons." }] }),
  component: ArmoryPage,
});
const TOOLS = [
  { name: "Sniper overview", href: "/", img: "/theme/mock-sniper-overview.png", icon: ICONS.target },
  { name: "Market radar", href: "/", img: "/theme/mock-sniper-dashboard.png", icon: ICONS.radar },
  { name: "Asset detail", href: "/", img: "/theme/mock-sniper-detail.png", icon: ICONS.score },
  { name: "Sergeant overview", href: "/sergeant", img: "/theme/mock-sergeant-overview.png", icon: ICONS.sergeant },
  { name: "Paper book", href: "/sergeant", img: "/theme/mock-sergeant-book.png", icon: ICONS.paperBook },
  { name: "Risk controls", href: "/sergeant", img: "/theme/mock-sergeant-risk.png", icon: ICONS.kill },
  { name: "Ops log", href: "/ops", img: "/theme/mock-ops-log.png", icon: ICONS.opsLog },
] as const;
function ArmoryPage() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader active="armory" signedIn={!!user} />
      <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6">
        <section className="mil-panel p-5">
          <div className="flex items-center gap-2">
            <PixelIcon name={ICONS.supply} className="pixel h-8 w-8" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80">Armory</p>
              <h1 className="pixel-title text-3xl text-primary">Screen locker</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Full web7 screens + pixel pack 1–50. No crops.</p>
        </section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.name} to={t.href} className="mil-panel overflow-hidden hover:border-primary/50">
              <img src={t.img} alt={t.name} className="w-full object-contain" />
              <p className="flex items-center gap-2 border-t border-border px-3 py-2 text-xs font-bold uppercase tracking-wide">
                <PixelIcon name={t.icon} className="pixel h-4 w-4" />
                {t.name}
              </p>
            </Link>
          ))}
        </div>
        <section className="mil-panel p-4">
          <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Pixel pack (full files)</p>
          <div className="flex flex-wrap gap-2">
            {[ICONS.aim, ICONS.sniperGun, ICONS.ammoBox, ICONS.grenade, ICONS.target, ICONS.radar, ICONS.acquire, ICONS.watch, ICONS.standDown, ICONS.paperBook, ICONS.opsLog].map((f) => (
              <img key={f} src={`/theme/icons/${f}`} alt={f} className="pixel h-10 w-10 border border-border bg-surface-2 p-1" title={f} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}