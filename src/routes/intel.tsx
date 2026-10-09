import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { IntelSection } from "@/components/btd/IntelSection";
import { NewsFeed } from "@/components/btd/NewsFeed";
import { DataStatus, type DataStatusState } from "@/components/btd/DataStatus";
import { useAuth } from "@/hooks/useAuth";
import { useLiveRankings } from "@/hooks/useLiveRankings";

export const Route = createFileRoute("/intel")({
  head: () => ({
    meta: [
      { title: "Intel | BTD Commando" },
      { name: "description", content: "Macro and news research context for field intelligence." },
    ],
  }),
  component: IntelPage,
});

function IntelPage() {
  const { data, isPending, error, isLive, refetch } = useLiveRankings();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newsStatus, setNewsStatus] = useState("SYNCING");
  const setStableNewsStatus = useCallback((status: string) => setNewsStatus(status), []);
  const dataState: DataStatusState = isPending
    ? "loading"
    : error
      ? "offline"
      : !data?.assets.length
        ? "empty"
        : isLive
          ? "live"
          : "snapshot";

  const selectIntelCategory = useCallback((category: string) => {
    setSelectedCategory(category);
    window.requestAnimationFrame(() => {
      const feed = document.getElementById("news-intelligence");
      if (!feed) return;
      const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const top = feed.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader active="intel" signedIn={!!user} status={<span>Intel {newsStatus}</span>} />
      <div className="mx-auto max-w-[1600px] px-4 pt-4">
        <DataStatus
          state={dataState}
          detail={
            dataState === "offline"
              ? "Ranking context is unavailable. News intelligence may still load independently."
              : dataState === "empty"
                ? "The ranking source responded without assets, so ticker-linked context is unavailable."
                : dataState === "loading"
                  ? "Waiting for the first verified ranking snapshot."
                  : `${data?.assets.length ?? 0} assets available for ticker-linked context.`
          }
          updatedAt={data?.updatedAt}
          sources="BTD ranking snapshot"
          onRetry={() => void refetch()}
        />
      </div>
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6">
        <section className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <img
              src="/theme/intel/intel_buddy.png"
              alt="INTEL owl analyst companion"
              className="pixel h-24 w-24 object-contain"
              loading="eager"
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                INTEL // SIGNAL ANALYST
              </p>
              <p className="pixel-title text-sm text-primary">Operations desk / field library</p>
              <h1 className="pixel-title mt-1 text-3xl leading-none sm:text-4xl">Intel</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Visual context for weather conditions and defense demand.
              </p>
            </div>
          </div>
        </section>
        <IntelSection activeCategory={selectedCategory} onSelectCategory={selectIntelCategory} />
        <NewsFeed
          assets={data?.assets.map((asset) => asset.symbol) ?? []}
          filter={selectedCategory}
          onFilterChange={setSelectedCategory}
          onStatusChange={setStableNewsStatus}
        />
      </div>
    </main>
  );
}
