import type { BookMetrics, FeedState, Flag, KillState, SergeantBook } from "../sergeant";
import type { SergeantRiskBrief } from "../sergeant-risk";

export const SERGEANT_DESK_CONTEXT_ID = "sergeant_desk_context_v1" as const;
export const SERGEANT_DESK_CONTEXT_SOURCE = "client_reported_paper_snapshot" as const;

export interface SergeantDeskSelection {
  symbol: string;
  btdScore: number;
  confidence: number;
  flag: Flag;
  currentSleevePct: number;
  requestedSleevePct: number;
}

export interface SergeantDeskStress {
  id: string;
  label: string;
  estimatedEquity: number;
  estimatedLossPct: number;
}

export interface SergeantDeskContext {
  contextId: typeof SERGEANT_DESK_CONTEXT_ID;
  source: typeof SERGEANT_DESK_CONTEXT_SOURCE;
  generatedAt: string;
  formulaId: "btd_v1_0";
  policyId: "sergeant_policy_v1";
  selected: SergeantDeskSelection | null;
  book: {
    equity: number;
    drawdownPct: number;
    grossExposurePct: number;
    activeNames: number;
    maxSingleSleevePct: number;
    realizedPnl: number;
    unrealizedPnl: number;
  };
  kills: {
    any: boolean;
    globalHalt: boolean;
    reasons: string[];
  };
  risk: {
    engineId: "sergeant_risk_v2";
    posture: SergeantRiskBrief["posture"];
    bookHealth: number;
    paperRiskCeilingPct: number;
    inputReliability: number;
    reliabilityKnown: boolean;
    feedState: FeedState;
    reasons: string[];
    stress: SergeantDeskStress[];
  };
}

export interface BuildSergeantDeskContextInput {
  book: SergeantBook;
  metrics: BookMetrics;
  kills: KillState;
  risk: SergeantRiskBrief;
  selected?: {
    symbol: string;
    btdScore: number;
    confidence: number;
    flag: Flag;
    currentSleevePct: number;
    requestedSleevePct: number;
  } | null;
  generatedAt?: string;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const pct = (value: number) => clamp(value, 0, 100);
const rounded = (value: number, digits = 2) => {
  const p = 10 ** digits;
  return Math.round((value + Number.EPSILON) * p) / p;
};
const text = (value: unknown, max = 240) => typeof value === "string" ? value.trim().slice(0, max) : "";

function validFlag(value: unknown): value is Flag {
  return value === "ACQUIRE" || value === "WATCH" || value === "REDUCE" || value === "STAND DOWN";
}

function validFeedState(value: unknown): value is FeedState {
  return value === "live" || value === "snapshot" || value === "degraded" || value === "down";
}

function validPosture(value: unknown): value is SergeantRiskBrief["posture"] {
  return value === "CLEAR" || value === "CAUTION" || value === "REDUCE" || value === "NO INCREASE";
}

function isoOrNow(value: unknown): string {
  if (typeof value === "string") {
    const ms = Date.parse(value);
    if (Number.isFinite(ms)) return new Date(ms).toISOString();
  }
  return new Date().toISOString();
}

export function buildSergeantDeskContext(input: BuildSergeantDeskContextInput): SergeantDeskContext {
  const selected = input.selected
    ? {
        symbol: input.selected.symbol.trim().toUpperCase().slice(0, 16),
        btdScore: rounded(pct(input.selected.btdScore), 1),
        confidence: rounded(pct(input.selected.confidence), 1),
        flag: input.selected.flag,
        currentSleevePct: rounded(pct(input.selected.currentSleevePct), 1),
        requestedSleevePct: rounded(pct(input.selected.requestedSleevePct), 1),
      }
    : null;

  return {
    contextId: SERGEANT_DESK_CONTEXT_ID,
    source: SERGEANT_DESK_CONTEXT_SOURCE,
    generatedAt: isoOrNow(input.generatedAt),
    formulaId: "btd_v1_0",
    policyId: "sergeant_policy_v1",
    selected,
    book: {
      equity: rounded(Math.max(0, input.metrics.equity), 3),
      drawdownPct: rounded(pct(input.metrics.drawdownPct), 2),
      grossExposurePct: rounded(pct(input.metrics.grossExposure * 100), 2),
      activeNames: Math.max(0, Math.min(100, Math.round(input.metrics.activeNames))),
      maxSingleSleevePct: rounded(pct(input.metrics.maxSingleSleevePct), 2),
      realizedPnl: rounded(input.metrics.realizedPnl, 3),
      unrealizedPnl: rounded(input.metrics.unrealizedPnl, 3),
    },
    kills: {
      any: input.kills.any,
      globalHalt: input.kills.globalHalt,
      reasons: input.kills.reasons.slice(0, 8).map((reason) => reason.slice(0, 240)),
    },
    risk: {
      engineId: "sergeant_risk_v2",
      posture: input.risk.posture,
      bookHealth: rounded(pct(input.risk.bookHealth), 1),
      paperRiskCeilingPct: rounded(pct(input.risk.paperRiskCeilingPct), 1),
      inputReliability: rounded(pct(input.risk.inputReliability), 1),
      reliabilityKnown: input.risk.reliabilityKnown,
      feedState: input.risk.feedState,
      reasons: input.risk.reasons.slice(0, 8).map((reason) => reason.slice(0, 240)),
      stress: input.risk.stress.slice(0, 4).map((scenario) => ({
        id: scenario.id,
        label: scenario.label.slice(0, 120),
        estimatedEquity: rounded(Math.max(0, scenario.estimatedEquity), 3),
        estimatedLossPct: rounded(pct(scenario.estimatedLossPct), 2),
      })),
    },
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function boundedNumber(value: unknown, low: number, high: number): number | null {
  if (!finite(value)) return null;
  return clamp(value, low, high);
}

function safeReasons(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item)).filter(Boolean).slice(0, 8);
}

export function sanitizeSergeantDeskContext(value: unknown): SergeantDeskContext | null {
  if (!record(value)) return null;
  if (value["contextId"] !== SERGEANT_DESK_CONTEXT_ID) return null;
  if (value["source"] !== SERGEANT_DESK_CONTEXT_SOURCE) return null;
  if (value["formulaId"] !== "btd_v1_0" || value["policyId"] !== "sergeant_policy_v1") return null;

  const book = value["book"];
  const kills = value["kills"];
  const risk = value["risk"];
  if (!record(book) || !record(kills) || !record(risk)) return null;

  const equity = boundedNumber(book["equity"], 0, 1e9);
  const drawdownPct = boundedNumber(book["drawdownPct"], 0, 100);
  const grossExposurePct = boundedNumber(book["grossExposurePct"], 0, 100);
  const activeNames = boundedNumber(book["activeNames"], 0, 100);
  const maxSingleSleevePct = boundedNumber(book["maxSingleSleevePct"], 0, 100);
  const realizedPnl = boundedNumber(book["realizedPnl"], -1e9, 1e9);
  const unrealizedPnl = boundedNumber(book["unrealizedPnl"], -1e9, 1e9);
  const bookHealth = boundedNumber(risk["bookHealth"], 0, 100);
  const paperRiskCeilingPct = boundedNumber(risk["paperRiskCeilingPct"], 0, 20);
  const inputReliability = boundedNumber(risk["inputReliability"], 0, 100);
  const posture = risk["posture"];
  const feedState = risk["feedState"];
  if ([equity, drawdownPct, grossExposurePct, activeNames, maxSingleSleevePct, realizedPnl, unrealizedPnl, bookHealth, paperRiskCeilingPct, inputReliability].some((x) => x === null)) return null;
  if (!validPosture(posture) || !validFeedState(feedState)) return null;
  if (risk["engineId"] !== "sergeant_risk_v2") return null;
  if (typeof kills["any"] !== "boolean" || typeof kills["globalHalt"] !== "boolean" || typeof risk["reliabilityKnown"] !== "boolean") return null;

  let selected: SergeantDeskSelection | null = null;
  if (value["selected"] !== null && value["selected"] !== undefined) {
    const raw = value["selected"];
    if (!record(raw)) return null;
    const symbol = text(raw["symbol"], 16).toUpperCase();
    const btdScore = boundedNumber(raw["btdScore"], 0, 100);
    const confidence = boundedNumber(raw["confidence"], 0, 100);
    const currentSleevePct = boundedNumber(raw["currentSleevePct"], 0, 100);
    const requestedSleevePct = boundedNumber(raw["requestedSleevePct"], 0, 100);
    if (!symbol || !/^[A-Z0-9][A-Z0-9._-]{0,15}$/.test(symbol) || btdScore === null || confidence === null || currentSleevePct === null || requestedSleevePct === null || !validFlag(raw["flag"])) return null;
    selected = { symbol, btdScore, confidence, currentSleevePct, requestedSleevePct, flag: raw["flag"] };
  }

  const rawStress = Array.isArray(risk["stress"]) ? risk["stress"] : [];
  const stress: SergeantDeskStress[] = [];
  for (const item of rawStress.slice(0, 4)) {
    if (!record(item)) continue;
    const id = text(item["id"], 80);
    const label = text(item["label"], 120);
    const estimatedEquity = boundedNumber(item["estimatedEquity"], 0, 1e9);
    const estimatedLossPct = boundedNumber(item["estimatedLossPct"], 0, 100);
    if (id && label && estimatedEquity !== null && estimatedLossPct !== null) {
      stress.push({ id, label, estimatedEquity, estimatedLossPct });
    }
  }

  return {
    contextId: SERGEANT_DESK_CONTEXT_ID,
    source: SERGEANT_DESK_CONTEXT_SOURCE,
    generatedAt: isoOrNow(value["generatedAt"]),
    formulaId: "btd_v1_0",
    policyId: "sergeant_policy_v1",
    selected,
    book: {
      equity: equity!, drawdownPct: drawdownPct!, grossExposurePct: grossExposurePct!,
      activeNames: Math.round(activeNames!), maxSingleSleevePct: maxSingleSleevePct!,
      realizedPnl: realizedPnl!, unrealizedPnl: unrealizedPnl!,
    },
    kills: {
      any: kills["any"],
      globalHalt: kills["globalHalt"],
      reasons: safeReasons(kills["reasons"]),
    },
    risk: {
      engineId: "sergeant_risk_v2",
      posture,
      bookHealth: bookHealth!,
      paperRiskCeilingPct: paperRiskCeilingPct!,
      inputReliability: inputReliability!,
      reliabilityKnown: risk["reliabilityKnown"],
      feedState,
      reasons: safeReasons(risk["reasons"]),
      stress,
    },
  };
}

export interface ContextualDeskReply {
  topic: string;
  message: string;
}

function snapshotPrefix(context: SergeantDeskContext): string {
  return `Desk snapshot (${context.risk.feedState.toUpperCase()}, paper-only):`;
}

function selectedLine(context: SergeantDeskContext): string {
  const s = context.selected;
  if (!s) return "No selected Sniper symbol is attached to this chat snapshot.";
  return `${s.symbol}: BTD ${s.btdScore.toFixed(1)}, input reliability ${s.confidence.toFixed(0)}/100, paper posture ${s.flag}, current sleeve ${s.currentSleevePct.toFixed(1)}%, typed target ${s.requestedSleevePct.toFixed(1)}%.`;
}

export function contextualSergeantDeskReply(message: string, context: SergeantDeskContext | null | undefined): ContextualDeskReply | null {
  if (!context) return null;
  const q = String(message ?? "").trim();
  if (!q) return null;

  if (/\b(book health|how(?:'s| is) my (?:paper )?book|paper book status|desk status|risk brief|risk posture)\b/i.test(q)) {
    return {
      topic: "desk_health",
      message: `${snapshotPrefix(context)} health ${context.risk.bookHealth.toFixed(1)}/100, posture ${context.risk.posture}, drawdown ${context.book.drawdownPct.toFixed(2)}%, gross ${context.book.grossExposurePct.toFixed(1)}%, largest sleeve ${context.book.maxSingleSleevePct.toFixed(1)}%, and deterministic new/increase ceiling ${context.risk.paperRiskCeilingPct.toFixed(1)}% per name. ${selectedLine(context)} This is a client-reported local paper snapshot, not broker data or a live-order instruction.`,
    };
  }

  if (/\bwhy\b.{0,30}\b(caution|reduce|no increase|posture|risk|ceiling)\b/i.test(q) || /\bwhat.*(?:driving|causing).*posture\b/i.test(q)) {
    const reasons = context.risk.reasons.length ? context.risk.reasons.join(" ") : "No additional deterministic reason was recorded.";
    return {
      topic: "desk_posture_reason",
      message: `${snapshotPrefix(context)} posture is ${context.risk.posture}. ${reasons} The overlay can tighten new/increased paper exposure, but it does not rewrite the BTD score, force a liquidation, or authorize a live trade.`,
    };
  }

  if (/\b(risk ceiling|paper risk ceiling|max(?:imum)? paper|paper capacity|how much.*paper|how much.*increase)\b/i.test(q)) {
    const selected = context.selected ? ` Current ${context.selected.symbol} paper sleeve is ${context.selected.currentSleevePct.toFixed(1)}%.` : "";
    return {
      topic: "desk_ceiling",
      message: `${snapshotPrefix(context)} deterministic per-name ceiling for any new or increased paper target is ${context.risk.paperRiskCeilingPct.toFixed(1)}%.${selected} It is a safety cap, not a recommended position size. Reductions remain available even when an existing sleeve is already above the ceiling.`,
    };
  }

  if (/\b(can i|am i allowed to|could i)\b.{0,35}\b(increase|add|raise)\b/i.test(q)) {
    const selected = context.selected;
    const state = context.risk.posture === "NO INCREASE" || context.risk.paperRiskCeilingPct <= 0
      ? "The current deterministic desk state blocks new or increased paper exposure."
      : `The desk permits only paper targets at or below the ${context.risk.paperRiskCeilingPct.toFixed(1)}% safety ceiling, subject to the existing kill controls.`;
    const focus = selected ? ` ${selected.symbol} is currently ${selected.currentSleevePct.toFixed(1)}% in the local paper book.` : "";
    return {
      topic: "desk_increase_rule",
      message: `${snapshotPrefix(context)} ${state}${focus} I can explain the paper rule, but chat does not change the book and this is not a personalized live-market recommendation.`,
    };
  }

  const stressRequested = /\b(stress|stress test|scenario|crash|drop|falls?|down)\b/i.test(q);
  if (stressRequested) {
    const wanted = /35\s*%/.test(q) ? 35 : /20\s*%/.test(q) ? 20 : /10\s*%/.test(q) ? 10 : null;
    const scenario = wanted === null
      ? context.risk.stress.find((row) => row.id === "book_down_20") ?? context.risk.stress[0]
      : context.risk.stress.find((row) => row.label.includes(`−${wanted}%`));
    if (scenario) {
      return {
        topic: "desk_stress",
        message: `${snapshotPrefix(context)} ${scenario.label} estimates a ${scenario.estimatedLossPct.toFixed(2)}% paper-book loss and NAV ${scenario.estimatedEquity.toFixed(2)} from the current local snapshot. This is a simple deterministic shock, not a forecast.`,
      };
    }
    return {
      topic: "desk_stress",
      message: `${snapshotPrefix(context)} no active paper positions are available for a stress calculation.`,
    };
  }

  if (/\b(kill|halt|drawdown limit|name limit|sleeve cap)\b/i.test(q) && /\b(my|current|active|tripped|status)\b/i.test(q)) {
    const status = context.kills.any ? `TRIPPED: ${context.kills.reasons.join(" ") || "one or more deterministic limits are active."}` : "clear; no deterministic kill is currently tripped.";
    return {
      topic: "desk_kills",
      message: `${snapshotPrefix(context)} kill status is ${status} Global halt is ${context.kills.globalHalt ? "ON" : "OFF"}. Reductions remain available when an increase is blocked.`,
    };
  }

  if (/\b(selected|focus|current symbol|current name|this asset|input reliability|confidence)\b/i.test(q)) {
    return {
      topic: "desk_selected",
      message: `${snapshotPrefix(context)} ${selectedLine(context)} The values describe the local paper desk and BTD input reliability, not guaranteed future performance.`,
    };
  }

  return null;
}
