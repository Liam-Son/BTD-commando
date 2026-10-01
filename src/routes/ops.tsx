import { createFileRoute, Link } from "@tanstack/react-router";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { ICONS, PixelIcon } from "@/components/btd/PixelIcon";
import { useAuth } from "@/hooks/useAuth";
export const Route = createFileRoute("/ops")({
  head: () => ({ meta: [{ title: "Ops Log | BTD Commando" }, { name: "description", content: "BTD Commando Ops Log." }] }),
  component: OpsPage,
});
function OpsPage() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader active="ops" signedIn={!!user} />
      <div className="mx-auto max-w-[900px] space-y-4 px-4 py-6">
        <section className="mil-panel overflow-hidden p-0">
          <img src="/theme/mock-ops-log.png" alt="Ops log UI pack" className="w-full object-contain" />
        </section>
        <section className="mil-panel p-5">
          <div className="flex items-center gap-2">
            <PixelIcon name={ICONS.opsLog} className="pixel h-7 w-7" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80">Ops Log</p>
              <h1 className="pixel-title text-2xl text-primary">Mission log</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Full web7 ops mock. Live events on Sergeant paper book + CSV.</p>
          <Link to="/sergeant" className="mt-4 inline-flex items-center gap-2 border-2 border-primary bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground">
            <PixelIcon name={ICONS.paperBook} className="pixel h-4 w-4" /> Open Sergeant
          </Link>
        </section>
      </div>
    </main>
  );
}