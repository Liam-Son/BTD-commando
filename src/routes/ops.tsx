import { createFileRoute, Link } from "@tanstack/react-router";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/ops")({
  head: () => ({
    meta: [
      { title: "Ops Log | BTD Commando" },
      {
        name: "description",
        content: "BTD Commando Ops Log — paper mission log entry point. Research only.",
      },
    ],
  }),
  component: OpsPage,
});

function OpsPage() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader active="ops" signedIn={!!user} />
      <div className="mx-auto max-w-[900px] space-y-4 px-4 py-6">
        <section className="mil-panel p-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80">Ops Log</p>
          <h1 className="pixel-title mt-1 text-3xl text-primary">Mission log</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Paper ops events live on the Sergeant desk (local book + CSV export). This page is the
            ops entry — full timeline UI expands later without touching{" "}
            <span className="tabular text-foreground">btd_v1_0</span>.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/sergeant"
              className="inline-flex border-2 border-primary bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground"
            >
              Open Sergeant log →
            </Link>
            <Link
              to="/"
              className="inline-flex border-2 border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"
            >
              ← Sniper
            </Link>
          </div>
        </section>
        <section className="mil-panel p-4 text-[12px] text-muted-foreground">
          <p className="font-semibold uppercase tracking-wide text-foreground">ROE</p>
          <p className="mt-1">Score ≠ order · paper only · not investment advice.</p>
        </section>
      </div>
    </main>
  );
}
