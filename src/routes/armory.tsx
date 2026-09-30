import { createFileRoute, Link } from "@tanstack/react-router";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/armory")({
  head: () => ({
    meta: [
      { title: "Armory | BTD Commando" },
      {
        name: "description",
        content: "BTD Commando Armory — tools locker (scaffold). Research only.",
      },
    ],
  }),
  component: ArmoryPage,
});

function ArmoryPage() {
  const { user } = useAuth();
  const tools = [
    { name: "Sniper board", href: "/", desc: "Live BTD rankings", icon: "/theme/icon-rifle.png" },
    { name: "Sergeant desk", href: "/sergeant", desc: "Paper discipline book", icon: "/theme/icon-ammo.png" },
    { name: "Ops log", href: "/ops", desc: "Mission / paper log view", icon: "/theme/icon-grenade.png" },
    { name: "Stocks board", href: "/stocks", desc: "Equity-only filter", icon: "/theme/icon-rifle.png" },
    { name: "Crypto board", href: "/crypto", desc: "Crypto-only filter", icon: "/theme/icon-ammo.png" },
  ] as const;

  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader active="armory" signedIn={!!user} />
      <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6">
        <section className="mil-panel p-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80">Armory</p>
          <h1 className="pixel-title mt-1 text-3xl text-primary">Tools locker</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Quick links into Commando tools. More gear later — formula stays{" "}
            <span className="tabular text-foreground">btd_v1_0</span>.
          </p>
        </section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.name}
              to={t.href}
              className="mil-panel flex items-center gap-3 p-4 transition hover:border-primary/60"
            >
              <img src={t.icon} alt="" className="pixel h-12 w-12 object-contain" width={48} height={48} />
              <div>
                <p className="font-bold uppercase tracking-wide">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
