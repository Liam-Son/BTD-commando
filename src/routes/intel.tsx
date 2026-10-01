import { createFileRoute } from "@tanstack/react-router";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { IntelSection } from "@/components/btd/IntelSection";
import { NewsFeed } from "@/components/btd/NewsFeed";
import { useLiveRankings } from "@/hooks/useLiveRankings";

export const Route = createFileRoute("/intel")({
  head: () => ({
    meta: [
      { title: "Intel | BTD Commando" },
      {
        name: "description",
        content: "Macro context and field intelligence reference library.",
      },
    ],
  }),
  component: IntelPage,
});

function IntelPage() {
  const { data, isLive } = useLiveRankings();

  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader
        active="intel"
        status={<span>{isLive ? "Intel feed live" : "Intel snapshot"}</span>}
      />
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6">
        <section className="border-b border-border pb-4">
          <p className="pixel-title text-sm text-primary">Operations desk / field library</p>
          <h1 className="pixel-title mt-1 text-3xl leading-none sm:text-4xl">Intel</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Visual context for weather, defense demand, geography, resources and critical alerts.
          </p>
        </section>
        <IntelSection />
        <NewsFeed assets={data?.assets.map((asset) => asset.symbol) ?? []} />
      </div>
    </main>
  );
}