import { createFileRoute, Link } from "@tanstack/react-router";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { useAuth } from "@/hooks/useAuth";
export const Route = createFileRoute("/armory")({
  head: () => ({ meta: [{ title: "Armory | BTD Commando" }, { name: "description", content: "BTD Commando Armory — full screen mocks." }] }),
  component: ArmoryPage,
});
const TOOLS = [
  { name: "Sniper overview", href: "/", img: "/theme/mock-sniper-overview.png" },
  { name: "Market radar", href: "/", img: "/theme/mock-sniper-dashboard.png" },
  { name: "Asset detail", href: "/", img: "/theme/mock-sniper-detail.png" },
  { name: "Sergeant overview", href: "/sergeant", img: "/theme/mock-sergeant-overview.png" },
  { name: "Paper book", href: "/sergeant", img: "/theme/mock-sergeant-book.png" },
  { name: "Risk controls", href: "/sergeant", img: "/theme/mock-sergeant-risk.png" },
  { name: "Ops log", href: "/ops", img: "/theme/mock-ops-log.png" },
] as const;
function ArmoryPage() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader active="armory" signedIn={!!user} />
      <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6">
        <section className="mil-panel p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80">Armory</p>
          <h1 className="pixel-title mt-1 text-3xl text-primary">Screen locker</h1>
          <p className="mt-2 text-sm text-muted-foreground">Full delivered mocks only — no crops.</p>
        </section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.name} to={t.href} className="mil-panel overflow-hidden hover:border-primary/50">
              <img src={t.img} alt={t.name} className="w-full object-contain" />
              <p className="border-t border-border px-3 py-2 text-xs font-bold uppercase tracking-wide">{t.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}