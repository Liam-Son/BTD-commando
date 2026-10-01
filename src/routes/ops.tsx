import { createFileRoute, Link } from "@tanstack/react-router";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { useAuth } from "@/hooks/useAuth";
export const Route = createFileRoute("/ops")({
  head: () => ({ meta: [{ title: "Ops Log | BTD Commando" }, { name: "description", content: "BTD Commando Ops Log. Research / paper only." }] }),
  component: OpsPage,
});
function OpsPage() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader active="ops" signedIn={!!user} />
      <div className="mx-auto max-w-[900px] space-y-4 px-4 py-6">
        <section className="mil-panel overflow-hidden p-0">
          <img src="/theme/mock-ops-log.png" alt="Ops log screen" className="w-full object-contain" width={386} height={207} />
        </section>
        <section className="mil-panel p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80">Ops Log</p>
          <h1 className="pixel-title mt-1 text-2xl text-primary">Mission log</h1>
          <p className="mt-2 text-sm text-muted-foreground">Full delivered ops mock. Live events stay on Sergeant paper book + CSV.</p>
          <Link to="/sergeant" className="mt-4 inline-flex border-2 border-primary bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground">Open Sergeant →</Link>
        </section>
      </div>
    </main>
  );
}