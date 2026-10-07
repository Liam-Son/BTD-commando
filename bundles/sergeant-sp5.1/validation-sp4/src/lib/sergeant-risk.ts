import type { BookMetrics, FeedState, KillState, SergeantBook } from "./sergeant";

export const SERGEANT_RISK_ENGINE_ID = "sergeant_risk_v2" as const;
export const DEFAULT_FRESH_BOOK_CAP_PCT = 20;

export type SergeantRiskPosture = "CLEAR" | "CAUTION" | "REDUCE" | "NO INCREASE";
export type StressScope = "all_positions" | "largest_position";

export interface SergeantRiskComponents {
  drawdownHeadroom: number;
  concentrationHeadroom: number;
  grossDiscipline: number;
  feedQuality: number;
  inputReliability: number;
}

export interface SergeantStressScenario {
  id: "book_down_10" | "book_down_20" | "book_down_35" | "largest_position_down_35";
  label: string;
  scope: StressScope;
  shockPct: number;
  estimatedEquity: number;
  estimatedLossPct: number;
  symbol?: string;
}

export interface SergeantRiskBrief {
  engineId: typeof SERGEANT_RISK_ENGINE_ID;
  posture: SergeantRiskPosture;
  bookHealth: number;
  paperRiskCeilingPct: number;
  inputReliability: number;
  reliabilityKnown: boolean;
  feedState: FeedState;
  components: SergeantRiskComponents;
  stress: SergeantStressScenario[];
  reasons: string[];
}

export interface SergeantRiskInput {
  book: SergeantBook;
  metrics: BookMetrics;
  kills: KillState;
  feedState: FeedState;
  /** BTD input reliability/confidence in [0,100]. Unknown values use a conservative neutral 50. */
  inputReliability?: number | null;
  /** Safety overlay only. Does not rewrite Sergeant's frozen policy suggestion. */
  freshBookCapPct?: number;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const clamp100 = (value: number) => clamp(Number.isFinite(value) ? value : 0, 0, 100);
const round = (value: number, digits = 1) => {
  const p = 10 ** digits;
  return Math.round((value + Number.EPSILON) * p) / p;
};

export function feedQualityScore(feedState: FeedState): number {
  switch (feedState) {
    case "live": return 100;
    case "snapshot": return 75;
    case "degraded": return 50;
    case "down": return 0;
  }
}

function hardIncreaseKill(kills: KillState): boolean {
  // Max-names is scoped only to opening another name in the frozen Sergeant core.
  // It must not globally freeze increases to an already-held paper position.
  return kills.globalHalt || kills.drawdown || kills.sleeve;
}

export function stressSergeantBook(book: SergeantBook): SergeantStressScenario[] {
  const positionRows = book.positions
    .map((position) => ({ symbol: position.symbol, value: Math.max(0, position.units * position.lastPrice) }))
    .filter((position) => position.value > 0);
  const positionValue = positionRows.reduce((sum, position) => sum + position.value, 0);
  const equity = Math.max(0, book.cash + positionValue);

  const wholeBook = (id: SergeantStressScenario["id"], label: string, shockPct: number): SergeantStressScenario => {
    const shockedPositionValue = positionValue * (1 + shockPct / 100);
    const estimatedEquity = Math.max(0, book.cash + shockedPositionValue);
    const estimatedLossPct = equity > 0 ? ((equity - estimatedEquity) / equity) * 100 : 0;
    return {
      id,
      label,
      scope: "all_positions",
      shockPct,
      estimatedEquity: round(estimatedEquity, 3),
      estimatedLossPct: round(Math.max(0, estimatedLossPct), 2),
    };
  };

  const stress: SergeantStressScenario[] = [
    wholeBook("book_down_10", "All paper positions −10%", -10),
    wholeBook("book_down_20", "All paper positions −20%", -20),
    wholeBook("book_down_35", "All paper positions −35%", -35),
  ];

  const largest = positionRows.reduce<{ symbol: string; value: number } | null>(
    (best, row) => (!best || row.value > best.value ? row : best),
    null,
  );
  if (largest) {
    const estimatedEquity = Math.max(0, equity - largest.value * 0.35);
    const estimatedLossPct = equity > 0 ? ((equity - estimatedEquity) / equity) * 100 : 0;
    stress.push({
      id: "largest_position_down_35",
      label: `Largest paper position (${largest.symbol}) −35%`,
      scope: "largest_position",
      shockPct: -35,
      estimatedEquity: round(estimatedEquity, 3),
      estimatedLossPct: round(Math.max(0, estimatedLossPct), 2),
      symbol: largest.symbol,
    });
  }

  return stress;
}

export function sergeantRiskComponents(
  book: SergeantBook,
  metrics: BookMetrics,
  feedState: FeedState,
  inputReliability?: number | null,
): { components: SergeantRiskComponents; reliabilityKnown: boolean } {
  const reliabilityKnown = typeof inputReliability === "number" && Number.isFinite(inputReliability);
  const reliability = reliabilityKnown ? clamp100(inputReliability) : 50;

  const drawdownLimit = Math.max(0.1, book.kills.maxDrawdownPct);
  const drawdownHeadroom = clamp100(100 * (1 - metrics.drawdownPct / drawdownLimit));

  const concentrationLimit = Math.max(1, book.kills.maxSleevePct);
  const concentrationHeadroom = metrics.activeNames === 0 || metrics.maxSingleSleevePct <= 0
    ? 100
    : clamp100(100 * (1 - metrics.maxSingleSleevePct / concentrationLimit));

  // This is an operational-discipline component, not a return forecast. A fully invested
  // long-only normalized book still retains 70/100 rather than being treated as unhealthy.
  const grossDiscipline = clamp100(100 - Math.max(0, metrics.grossExposure) * 30);

  return {
    reliabilityKnown,
    components: {
      drawdownHeadroom: round(drawdownHeadroom),
      concentrationHeadroom: round(concentrationHeadroom),
      grossDiscipline: round(grossDiscipline),
      feedQuality: feedQualityScore(feedState),
      inputReliability: round(reliability),
    },
  };
}

export function sergeantBookHealth(components: SergeantRiskComponents): number {
  const score =
    components.drawdownHeadroom * 0.30 +
    components.concentrationHeadroom * 0.25 +
    components.grossDiscipline * 0.15 +
    components.feedQuality * 0.15 +
    components.inputReliability * 0.15;
  return round(clamp100(score));
}

export function sergeantPaperRiskCeilingPct(
  book: SergeantBook,
  metrics: BookMetrics,
  kills: KillState,
  feedState: FeedState,
  inputReliability?: number | null,
  freshBookCapPct = DEFAULT_FRESH_BOOK_CAP_PCT,
): number {
  if (feedState === "down" || hardIncreaseKill(kills)) return 0;

  const { components } = sergeantRiskComponents(book, metrics, feedState, inputReliability);
  const baseCap = Math.max(0, Math.min(freshBookCapPct, book.kills.maxSleevePct));
  if (baseCap <= 0) return 0;

  const reliabilityFactor = components.inputReliability / 100;
  const drawdownFactor = Math.sqrt(components.drawdownHeadroom / 100);
  const feedFactor = components.feedQuality / 100;

  // Per-name concentration is already hard-enforced by maxSleevePct and evaluated
  // separately in book health/posture. Do not collapse the ceiling for every other
  // name merely because one existing position is at its own cap. The ceiling remains
  // a per-name target cap, while the core Sergeant book still enforces <=100% gross.
  const riskFactor = clamp(Math.min(reliabilityFactor, drawdownFactor, feedFactor), 0, 1);
  return round(baseCap * riskFactor, 1);
}

function utilization(value: number, limit: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(limit) || limit <= 0) return 1;
  return Math.max(0, value / limit);
}


export function sergeantRiskCeilingBlocksIncrease(
  currentSleeve: number,
  requestedSleeve: number,
  brief: Pick<SergeantRiskBrief, "paperRiskCeilingPct">,
): boolean {
  const current = clamp(Number.isFinite(currentSleeve) ? currentSleeve : 0, 0, 1);
  const requested = clamp(Number.isFinite(requestedSleeve) ? requestedSleeve : 0, 0, 1);
  const increasing = requested > current + 1e-9;
  return increasing && requested * 100 > brief.paperRiskCeilingPct + 1e-9;
}

export function assessSergeantRisk(input: SergeantRiskInput): SergeantRiskBrief {
  const { book, metrics, kills, feedState, inputReliability } = input;
  const { components, reliabilityKnown } = sergeantRiskComponents(book, metrics, feedState, inputReliability);
  const bookHealth = sergeantBookHealth(components);
  const paperRiskCeilingPct = sergeantPaperRiskCeilingPct(
    book,
    metrics,
    kills,
    feedState,
    inputReliability,
    input.freshBookCapPct ?? DEFAULT_FRESH_BOOK_CAP_PCT,
  );

  const ddUse = utilization(metrics.drawdownPct, book.kills.maxDrawdownPct);
  const concentrationUse = metrics.activeNames > 0
    ? utilization(metrics.maxSingleSleevePct, book.kills.maxSleevePct)
    : 0;
  const reasons: string[] = [];

  let posture: SergeantRiskPosture;
  if (feedState === "down" || hardIncreaseKill(kills)) {
    posture = "NO INCREASE";
    if (feedState === "down") reasons.push("Feed DOWN blocks new or increased paper exposure.");
    reasons.push(...kills.reasons);
  } else if (ddUse >= 0.75 || bookHealth < 40 || paperRiskCeilingPct <= 2) {
    posture = "REDUCE";
    if (ddUse >= 0.75) reasons.push(`Drawdown has used ${round(ddUse * 100, 0)}% of the configured limit.`);
    if (bookHealth < 40) reasons.push(`Operational book health is low at ${bookHealth}/100.`);
    if (paperRiskCeilingPct <= 2) reasons.push(`Safety overlay leaves only ${paperRiskCeilingPct.toFixed(1)}% paper-risk capacity per name.`);
  } else if (feedState !== "live" || kills.names || concentrationUse >= 0.90 || bookHealth < 70 || paperRiskCeilingPct < 10) {
    posture = "CAUTION";
    if (feedState !== "live") reasons.push(`Feed state is ${feedState.toUpperCase()}, not live.`);
    if (kills.names) reasons.push("Max-names limit is reached: another new paper name is blocked, but existing-name changes remain subject to the other controls.");
    if (concentrationUse >= 0.90) reasons.push(`Largest paper position has used ${round(concentrationUse * 100, 0)}% of the configured sleeve cap.`);
    if (bookHealth < 70) reasons.push(`Operational book health is ${bookHealth}/100.`);
    if (paperRiskCeilingPct < 10) reasons.push(`Safety overlay caps new/increased per-name paper targets at ${paperRiskCeilingPct.toFixed(1)}%.`);
  } else {
    posture = "CLEAR";
    reasons.push("No deterministic risk overlay condition currently requires tighter paper posture.");
  }

  if (!reliabilityKnown) reasons.push("Input reliability was unavailable; the risk overlay used a conservative neutral value of 50/100.");
  else if (components.inputReliability < 60) reasons.push(`Input reliability is low at ${components.inputReliability.toFixed(0)}/100.`);

  return {
    engineId: SERGEANT_RISK_ENGINE_ID,
    posture,
    bookHealth,
    paperRiskCeilingPct,
    inputReliability: components.inputReliability,
    reliabilityKnown,
    feedState,
    components,
    stress: stressSergeantBook(book),
    reasons: [...new Set(reasons)],
  };
}
