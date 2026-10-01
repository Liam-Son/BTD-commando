import { createFileRoute } from "@tanstack/react-router";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { IntelSection } from "@/components/btd/IntelSection";
import { NewsFeed } from "@/components/btd/NewsFeed";
import { useLiveRankings } from "@/hooks/useLiveRankings";
import { useState } from "react";

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
  const [selectedCategory, setSelectedCategory] = useState("all");

  function selectIntelCategory(category: string) {
    setSelectedCategory(category);
    window.requestAnimationFrame(() => {
      document.getElementById("news-intelligence")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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
            Visual context for weather conditions and defense demand.
          </p>
        </section>
        <IntelSection activeCategory={selectedCategory} onSelectCategory={selectIntelCategory} />
        <NewsFeed
          assets={data?.assets.map((asset) => asset.symbol) ?? []}
          filter={selectedCategory}
          onFilterChange={setSelectedCategory}
        />
      </div>
    </main>
  );
}