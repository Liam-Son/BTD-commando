import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ICONS, PixelIcon } from "@/components/btd/PixelIcon";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { useAuth } from "@/hooks/useAuth";
import { calculateConcentrationStress, calculateDrawdown } from "@/lib/ranger-training";

export const Route = createFileRoute("/ranger")({
  head: () => ({ meta: [{ title: "Ranger | Survive the market | BTD Commando" }] }),
  component: RangerPage,
});

const lessons = [
  {
    id: "competence",
    author: "Warren Buffett",
    title: "Know the edge of your map",
    lesson:
      "Evaluate businesses within your circle of competence. Knowing the limits of your understanding matters more than having an opinion on every company.",
    drill:
      "Explain how the business earns money, what could damage it, and which facts you cannot yet verify.",
    source: "Berkshire Hathaway · 1996 shareholder letter",
    url: "https://www.berkshirehathaway.com/letters/1996.html",
  },
  {
    id: "leverage",
    author: "Warren Buffett",
    title: "Do not let debt force your retreat",
    lesson:
      "Large price declines can happen unexpectedly. Borrowing to own stocks adds financial pressure and can disturb decision-making during a fall.",
    drill:
      "Stress-test the position without assuming a quick rebound. Identify any margin call, debt payment, or cash need that could force a sale.",
    source: "Berkshire Hathaway · 2017 shareholder letter, p. 10",
    url: "https://www.berkshirehathaway.com/letters/2017ltr.pdf",
  },
  {
    id: "homework",
    author: "Peter Lynch",
    title: "Recon before commitment",
    lesson:
      "A tip is not due diligence. Investigate the company, its earnings and financial position instead of blaming market machinery after an unresearched purchase.",
    drill:
      "Before a paper entry, read the financial statements and list evidence for the thesis and evidence against it.",
    source: "PBS FRONTLINE · Peter Lynch interview",
    url: "https://www.pbs.org/wgbh/pages/frontline/shows/betting/pros/lynch.html",
  },
  {
    id: "declines",
    author: "Peter Lynch",
    title: "Expect rough terrain",
    lesson:
      "Market declines are part of investing, but their timing is not reliably predictable. Preparation matters more than trying to call every market turn.",
    drill:
      "Decide how much volatility you can tolerate and what business evidence would invalidate your thesis before prices move.",
    source: "PBS FRONTLINE · Peter Lynch interview",
    url: "https://www.pbs.org/wgbh/pages/frontline/shows/betting/pros/lynch.html",
  },
];
const checks = [
  "I can explain the thesis and its uncertainties.",
  "I checked leverage, liquidity and concentration.",
  "I defined what would invalidate the thesis.",
  "I can withstand the loss without relying on a rebound.",
  "I am not treating a famous investor or a whale as an order.",
];

function RangerPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [checked, setChecked] = useState<boolean[]>(checks.map(() => false));
  const [thesis, setThesis] = useState("");
  const [contraryEvidence, setContraryEvidence] = useState("");
  const [invalidation, setInvalidation] = useState("");
  const [loss, setLoss] = useState("20");
  const [sleeve, setSleeve] = useState("25");
  const [positionLoss, setPositionLoss] = useState("40");
  const drawdown = calculateDrawdown(loss);
  const stress = calculateConcentrationStress(sleeve, positionLoss);
  const completed = checked.filter(Boolean).length;

  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader
        active="ranger"
        signedIn={!!user}
        status={<span>Survival school · sourced lessons · no trade orders</span>}
      />
      <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6">
        <section className="mil-panel grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              RANGER / CAPITAL SURVIVAL
            </p>
            <h1 className="pixel-title mt-2 text-3xl sm:text-4xl">Stay in the game.</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Survival skills and research discipline inspired by Peter Lynch and Warren Buffett.
              Learn the principles, then do your own recon. Hunter follows large transfers; Ranger
              protects your decision process.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/hunter" className="mil-tab">
                Open Hunter
              </Link>
              <Link to="/sergeant" className="mil-tab">
                Paper discipline
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-primary/30 bg-surface p-4">
            <picture>
              <source srcSet="/theme/ranger/ranger_buddy.avif" type="image/avif" />
              <source srcSet="/theme/ranger/ranger_buddy.webp" type="image/webp" />
              <img
                src="/theme/ranger/ranger_buddy.png"
                alt="RANGER wilderness instructor"
                width={1920}
                height={1920}
                className="pixel h-24 w-24 object-contain"
                loading="eager"
                decoding="async"
              />
            </picture>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                RANGER // FIELD GUIDE
              </p>
              <p className="pixel-title text-primary">SURVIVE FIRST</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No guru signals.
                <br />
                No guaranteed returns.
              </p>
            </div>
          </div>
        </section>

        <section className="mil-panel p-5" aria-labelledby="field-manual-heading">
          <h2 id="field-manual-heading" className="text-xl font-bold">
            Field manual · lessons from the greats
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Our summaries are paraphrases, not direct quotations or endorsements. The drills are BTD
            educational adaptations, not instructions attributed to the authors. Source links open
            the original material.
          </p>
          <div className="my-4 flex flex-wrap gap-2" aria-label="Filter lessons by author">
            {["All", "Warren Buffett", "Peter Lynch"].map((author) => (
              <button
                key={author}
                type="button"
                aria-pressed={filter === author}
                className={`mil-tab ${filter === author ? "mil-tab-active" : ""}`}
                onClick={() => setFilter(author)}
              >
                {author}
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {lessons
              .filter((lesson) => filter === "All" || lesson.author === filter)
              .map((lesson) => (
                <article key={lesson.id} className="border border-border bg-surface p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    {lesson.author}
                  </p>
                  <h3 className="mt-2 text-lg font-bold">{lesson.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{lesson.lesson}</p>
                  <div className="mt-4 border-l-2 border-primary pl-3">
                    <p className="text-xs font-bold">BTD FIELD DRILL</p>
                    <p className="mt-1 text-sm">{lesson.drill}</p>
                  </div>
                  <a
                    href={lesson.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block text-xs text-primary underline"
                  >
                    Read source: {lesson.source}
                  </a>
                </article>
              ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="mil-panel space-y-3 p-5" aria-labelledby="worksheet-heading">
            <h2 id="worksheet-heading" className="text-xl font-bold">
              Mission worksheet
            </h2>
            <p className="text-xs text-muted-foreground">
              Session-only notes for research reflection. They are not a readiness score,
              recommendation, or order authorization.
            </p>
            <label className="block text-sm font-medium">
              Thesis
              <textarea
                value={thesis}
                onChange={(event) => setThesis(event.target.value)}
                className="mt-2 min-h-24 w-full rounded border border-border bg-background p-3 font-normal"
                placeholder="What evidence supports the idea?"
              />
            </label>
            <label className="block text-sm font-medium">
              Contrary evidence
              <textarea
                value={contraryEvidence}
                onChange={(event) => setContraryEvidence(event.target.value)}
                className="mt-2 min-h-24 w-full rounded border border-border bg-background p-3 font-normal"
                placeholder="What could make the thesis wrong?"
              />
            </label>
            <label className="block text-sm font-medium">
              Invalidation
              <textarea
                value={invalidation}
                onChange={(event) => setInvalidation(event.target.value)}
                className="mt-2 min-h-24 w-full rounded border border-border bg-background p-3 font-normal"
                placeholder="Which business evidence would change the view?"
              />
            </label>
            <button
              type="button"
              className="mil-tab"
              onClick={() => {
                setThesis("");
                setContraryEvidence("");
                setInvalidation("");
              }}
            >
              Clear worksheet
            </button>
          </section>
          <section className="mil-panel space-y-3 p-5" aria-labelledby="check-heading">
            <h2 id="check-heading" className="text-xl font-bold">
              Pre-mission survival check
            </h2>
            <p className="text-xs text-muted-foreground">
              Session-only checklist. Not a recommendation, readiness score, or trade approval.
            </p>
            {checks.map((check, index) => (
              <label
                key={check}
                className="flex items-start gap-3 border border-border p-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked[index]}
                  onChange={(event) =>
                    setChecked((current) =>
                      current.map((value, itemIndex) =>
                        itemIndex === index ? event.target.checked : value,
                      ),
                    )
                  }
                  className="mt-1"
                />
                {check}
              </label>
            ))}
            <p role="status" className="text-sm text-primary">
              {completed} / {checks.length} reviewed · no execution authorization
            </p>
            <button
              type="button"
              className="mil-tab"
              onClick={() => setChecked(checks.map(() => false))}
            >
              Reset checklist
            </button>
          </section>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="mil-panel space-y-4 p-5" aria-labelledby="drawdown-heading">
            <h2 id="drawdown-heading" className="text-xl font-bold">
              Drawdown terrain
            </h2>
            <p className="text-sm text-muted-foreground">
              A loss and the gain needed to recover are not symmetric. This is arithmetic, not a
              prediction.
            </p>
            <label className="block text-sm">
              Hypothetical loss (%)
              <input
                aria-label="Hypothetical loss percent"
                type="number"
                min="0"
                max="100"
                step="any"
                value={loss}
                onChange={(event) => setLoss(event.target.value)}
                className="mt-2 block w-full rounded border border-border bg-background p-3"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 50, 80].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="mil-tab"
                  onClick={() => setLoss(String(value))}
                >
                  {value}% loss
                </button>
              ))}
            </div>
            <div role="status" className="border border-primary/40 bg-surface p-4">
              {!drawdown.valid ? (
                <p>{drawdown.reason}</p>
              ) : drawdown.recoveryPercent === null ? (
                <p>Total loss: no finite gain can recover a zero balance without new capital.</p>
              ) : (
                <>
                  <p className="text-xs uppercase text-muted-foreground">
                    Gain needed to reach the starting value
                  </p>
                  <p className="pixel-title mt-2 text-3xl text-primary">
                    {drawdown.recoveryPercent.toFixed(1)}%
                  </p>
                  <p className="mt-2 text-sm">
                    From 100 to {drawdown.remainingUnits.toFixed(1)} units; recovery assumes no
                    fees, taxes, deposits or withdrawals.
                  </p>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formula: loss / (100 − loss) × 100. No position sizing or broker integration.
            </p>
          </section>
          <section className="mil-panel space-y-4 p-5" aria-labelledby="stress-heading">
            <h2 id="stress-heading" className="text-xl font-bold">
              Concentration stress
            </h2>
            <p className="text-sm text-muted-foreground">
              Deterministic educational arithmetic on a 100-unit starting book. Assumes the rest of
              the book stays unchanged, with no leverage, fees or taxes. This is not sizing advice,
              readiness, or order authorization.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Sleeve of book (%)
                <input
                  aria-label="Sleeve of book percent"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={sleeve}
                  onChange={(event) => setSleeve(event.target.value)}
                  className="mt-2 block w-full rounded border border-border bg-background p-3"
                />
              </label>
              <label className="text-sm">
                Position loss (%)
                <input
                  aria-label="Position loss percent"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={positionLoss}
                  onChange={(event) => setPositionLoss(event.target.value)}
                  className="mt-2 block w-full rounded border border-border bg-background p-3"
                />
              </label>
            </div>
            <div role="status" className="border border-primary/40 bg-surface p-4">
              {!stress.valid ? (
                <p>{stress.reason}</p>
              ) : (
                <>
                  <p className="text-xs uppercase text-muted-foreground">
                    Portfolio impact from this scenario
                  </p>
                  <p className="pixel-title mt-2 text-3xl text-primary">
                    −{stress.portfolioLossUnits.toFixed(2)} units
                  </p>
                  <p className="mt-2 text-sm">
                    100.00 starting units → {stress.remainingCapitalUnits.toFixed(2)} remaining
                    capital.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Arithmetic: {stress.sleevePercent}% × {stress.positionLossPercent}% ={" "}
                    {stress.portfolioLossUnits.toFixed(2)}% of the starting book.
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
        <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
          RANGER · Education and research only. Investor principles are not promises of safety or
          profit. Historical advice is not personalized financial advice. btd_v1_0 and paper policy
          are unchanged.
        </footer>
      </div>
    </main>
  );
}
