export const SERGEANT_POLICY_ID = "sergeant_policy_v1" as const;
export const BTD_FORMULA_ID = "btd_v1_0" as const;
export const SERGEANT_STORAGE_KEY = "btd.sergeant.v2" as const;
export const SERGEANT_LEGACY_STORAGE_KEY = "btd.sergeant.v1" as const;
export const SERGEANT_SCHEMA_VERSION = 2 as const;
export const UNIT_BOOK = 100;
export const MAX_LOG_ROWS = 500;

export type Flag = "ACQUIRE" | "WATCH" | "REDUCE" | "STAND DOWN";
export type FeedState = "live" | "snapshot" | "degraded" | "down";
export type OpsAction = "OPEN" | "RESIZE" | "CLOSE" | "LOG_ONLY" | "KILL_CHANGE";

export const SERGEANT_DEFAULTS = {
  acquireMin: 65,
  watchMin: 50,
  standDownMax: 35,
  sleeves: {
    acquire: 1,
    watch: 0.5,
    reduce: 0.25,
    standDown: 0.1,
  },
  kills: {
    maxDrawdownPct: 10,
    maxNames: 10,
    maxSleevePct: 100,
    globalHalt: false,
  },
} as const;

export interface KillConfig {
  maxDrawdownPct: number;
  maxNames: number;
  maxSleevePct: number;
  globalHalt: boolean;
}

export interface PaperPosition {
  symbol: string;
  name: string;
  assetClass: string;
  units: number;
  avgPrice: number;
  lastPrice: number;
  targetSleeve: number;
  openedAt: string;
  updatedAt: string;
}

export interface OpsLogRow {
  id: string;
  t: string;
  action: OpsAction;
  symbol: string | null;
  score: number | null;
  flag: Flag | null;
  suggestedSleeve: number | null;
  appliedSleeve: number | null;
  price: number | null;
  unitsDelta: number | null;
  realizedPnlDelta: number | null;
  equityAfter: number | null;
  reason: string;
  details: string;
  formulaId: string;
  policyId: string;
  feedState: FeedState | null;
}

export interface SergeantBook {
  schemaVersion: typeof SERGEANT_SCHEMA_VERSION;
  formulaId: typeof BTD_FORMULA_ID;
  policyId: typeof SERGEANT_POLICY_ID;
  cash: number;
  peakEquity: number;
  realizedPnl: number;
  positions: PaperPosition[];
  log: OpsLogRow[];
  kills: KillConfig;
  updatedAt: string;
}

export interface BookMetrics {
  equity: number;
  positionValue: number;
  grossExposure: number;
  targetGrossPct: number;
  drawdownPct: number;
  activeNames: number;
  maxSingleSleevePct: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface KillState {
  globalHalt: boolean;
  drawdown: boolean;
  names: boolean;
  sleeve: boolean;
  any: boolean;
  reasons: string[];
}

export interface LoadBookResult {
  book: SergeantBook;
  status: "fresh" | "loaded" | "migrated" | "recovered";
  warning: string | null;
}

export interface SaveBookResult {
  ok: boolean;
  error?: string;
}

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

/** Loose shape for untrusted JSON: named keys stay dot-accessible under noPropertyAccessFromIndexSignature. */
type LooseRecord = {
  symbol?: unknown; units?: unknown; avgPrice?: unknown; lastPrice?: unknown; name?: unknown;
  assetClass?: unknown; targetSleeve?: unknown; openedAt?: unknown; updatedAt?: unknown;
  action?: unknown; score?: unknown; suggestedSleeve?: unknown; appliedSleeve?: unknown;
  id?: unknown; t?: unknown; flag?: unknown; price?: unknown; unitsDelta?: unknown;
  realizedPnlDelta?: unknown; equityAfter?: unknown; reason?: unknown; details?: unknown;
  formulaId?: unknown; policyId?: unknown; feedState?: unknown; maxDrawdownPct?: unknown;
  maxNames?: unknown; maxSleevePct?: unknown; globalHalt?: unknown; positions?: unknown;
  log?: unknown; cash?: unknown; realizedPnl?: unknown; peakEquity?: unknown; kills?: unknown;
  schemaVersion?: unknown;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is LooseRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function finite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function finiteIn(value: unknown, min: number, max: number, fallback: number): number {
  return Math.min(max, Math.max(min, finite(value, fallback)));
}

function textValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function isoValue(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : fallback;
}

function validFlag(value: unknown): value is Flag {
  return value === "ACQUIRE" || value === "WATCH" || value === "REDUCE" || value === "STAND DOWN";
}

function validFeedState(value: unknown): value is FeedState {
  return value === "live" || value === "snapshot" || value === "degraded" || value === "down";
}

function validAction(value: unknown): value is OpsAction {
  return value === "OPEN" || value === "RESIZE" || value === "CLOSE" || value === "LOG_ONLY" || value === "KILL_CHANGE";
}

export function flagFromScore(score: number): Flag {
  if (!Number.isFinite(score) || score < 0 || score > 100) return "STAND DOWN";
  if (score >= SERGEANT_DEFAULTS.acquireMin) return "ACQUIRE";
  if (score >= SERGEANT_DEFAULTS.watchMin) return "WATCH";
  if (score > SERGEANT_DEFAULTS.standDownMax) return "REDUCE";
  return "STAND DOWN";
}

export function sleeveFromFlag(flag: Flag): number {
  switch (flag) {
    case "ACQUIRE": return SERGEANT_DEFAULTS.sleeves.acquire;
    case "WATCH": return SERGEANT_DEFAULTS.sleeves.watch;
    case "REDUCE": return SERGEANT_DEFAULTS.sleeves.reduce;
    case "STAND DOWN": return SERGEANT_DEFAULTS.sleeves.standDown;
  }
}

export function defaultBook(now = new Date().toISOString()): SergeantBook {
  return {
    schemaVersion: SERGEANT_SCHEMA_VERSION,
    formulaId: BTD_FORMULA_ID,
    policyId: SERGEANT_POLICY_ID,
    cash: UNIT_BOOK,
    peakEquity: UNIT_BOOK,
    realizedPnl: 0,
    positions: [],
    log: [],
    kills: { ...SERGEANT_DEFAULTS.kills },
    updatedAt: now,
  };
}

export function clampSleeve(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function normalizeKills(kills: KillConfig): KillConfig {
  return {
    maxDrawdownPct: Math.max(0.1, Math.min(100, finite(kills.maxDrawdownPct, SERGEANT_DEFAULTS.kills.maxDrawdownPct))),
    maxNames: Math.max(1, Math.min(100, Math.round(finite(kills.maxNames, SERGEANT_DEFAULTS.kills.maxNames)))),
    maxSleevePct: Math.max(1, Math.min(100, finite(kills.maxSleevePct, SERGEANT_DEFAULTS.kills.maxSleevePct))),
    globalHalt: Boolean(kills.globalHalt),
  };
}

export function markBook(
  book: SergeantBook,
  prices: Record<string, number>,
): { positions: PaperPosition[]; metrics: BookMetrics; nextPeak: number } {
  const positions = book.positions.map((p) => {
    const next = prices[p.symbol];
    const lastPrice = typeof next === "number" && Number.isFinite(next) && next > 0 ? next : p.lastPrice;
    return lastPrice === p.lastPrice ? p : { ...p, lastPrice };
  });
  const positionValue = positions.reduce((sum, p) => sum + p.units * p.lastPrice, 0);
  const equity = Math.max(0, book.cash + positionValue);
  const grossExposure = equity > 0 ? positionValue / equity : 0;
  const targetGrossPct = positions.reduce((sum, p) => sum + p.targetSleeve * 100, 0);
  const nextPeak = Math.max(book.peakEquity, equity);
  const drawdownPct = nextPeak > 0 ? Math.max(0, ((nextPeak - equity) / nextPeak) * 100) : 0;
  const active = positions.filter((p) => p.units > 1e-10 && p.targetSleeve > 1e-10);
  const maxSingleSleevePct = equity > 0 && active.length
    ? Math.max(...active.map((p) => ((p.units * p.lastPrice) / equity) * 100))
    : 0;
  const unrealizedPnl = positions.reduce((sum, p) => sum + p.units * (p.lastPrice - p.avgPrice), 0);
  return {
    positions,
    metrics: {
      equity,
      positionValue,
      grossExposure,
      targetGrossPct,
      drawdownPct,
      activeNames: active.length,
      maxSingleSleevePct,
      unrealizedPnl,
      realizedPnl: book.realizedPnl,
    },
    nextPeak,
  };
}

export function evaluateKills(book: SergeantBook, metrics: BookMetrics): KillState {
  const reasons: string[] = [];
  const globalHalt = book.kills.globalHalt;
  const drawdown = metrics.drawdownPct >= book.kills.maxDrawdownPct;
  const names = metrics.activeNames >= book.kills.maxNames;
  const sleeve = metrics.maxSingleSleevePct > book.kills.maxSleevePct + 1e-9;
  if (globalHalt) reasons.push("Global halt enabled");
  if (drawdown) reasons.push(`Book drawdown ${metrics.drawdownPct.toFixed(1)}% ≥ ${book.kills.maxDrawdownPct.toFixed(1)}%`);
  if (names) reasons.push(`Active names ${metrics.activeNames} at/above limit ${book.kills.maxNames}`);
  if (sleeve) reasons.push(`Actual single-name exposure ${metrics.maxSingleSleevePct.toFixed(1)}% > ${book.kills.maxSleevePct.toFixed(1)}% cap`);
  return { globalHalt, drawdown, names, sleeve, any: globalHalt || drawdown || names || sleeve, reasons };
}

export interface RebalanceInput {
  symbol: string;
  name: string;
  assetClass: string;
  price: number;
  score: number;
  flag: Flag;
  suggestedSleeve: number;
  appliedSleeve: number;
  reason: string;
  feedState: FeedState;
  now?: string;
  id?: string;
}

export type RebalanceResult =
  | { ok: true; book: SergeantBook; row: OpsLogRow }
  | { ok: false; error: string };

export function rebalancePaperPosition(book: SergeantBook, input: RebalanceInput): RebalanceResult {
  if (!input.symbol.trim()) return { ok: false, error: "Paper symbol is required." };
  if (!Number.isFinite(input.score) || input.score < 0 || input.score > 100) return { ok: false, error: "BTD score is invalid." };
  if (!Number.isFinite(input.price) || input.price <= 0) return { ok: false, error: "No valid paper fill price." };

  const canonicalFlag = flagFromScore(input.score);
  if (input.flag !== canonicalFlag) return { ok: false, error: "Flag does not match frozen Sergeant score bands." };
  const canonicalSleeve = sleeveFromFlag(canonicalFlag);
  if (Math.abs(clampSleeve(input.suggestedSleeve) - canonicalSleeve) > 1e-9) {
    return { ok: false, error: "Suggested sleeve does not match frozen Sergeant policy." };
  }

  const appliedSleeve = clampSleeve(input.appliedSleeve);
  const suggestedSleeve = canonicalSleeve;
  const current = book.positions.find((p) => p.symbol === input.symbol) ?? null;
  const currentSleeve = current?.targetSleeve ?? 0;
  const increasing = appliedSleeve > currentSleeve + 1e-9;
  const decreasing = appliedSleeve < currentSleeve - 1e-9;
  const marked = markBook(book, { [input.symbol]: input.price });
  const kills = evaluateKills(book, marked.metrics);

  if (input.feedState === "down" && increasing) return { ok: false, error: "Feed DOWN blocks new/increased paper exposure. Reductions remain available." };
  if (book.kills.globalHalt && increasing) return { ok: false, error: "Global halt blocks new/increased paper exposure." };
  if (kills.drawdown && increasing) return { ok: false, error: "Max-drawdown kill blocks new/increased paper exposure." };
  if (kills.sleeve && increasing) return { ok: false, error: "Single-name exposure kill blocks increases until concentration is reduced." };
  if (!current && increasing && marked.metrics.activeNames >= book.kills.maxNames) {
    return { ok: false, error: "Max-names limit blocks a new paper position." };
  }
  if (increasing && appliedSleeve * 100 > book.kills.maxSleevePct + 1e-9) {
    return { ok: false, error: `Requested sleeve exceeds ${book.kills.maxSleevePct.toFixed(0)}% cap.` };
  }
  if (Math.abs(appliedSleeve - suggestedSleeve) > 1e-9 && !input.reason.trim()) {
    return { ok: false, error: "Override reason is required when applied sleeve differs from suggestion." };
  }

  const otherTarget = book.positions
    .filter((p) => p.symbol !== input.symbol)
    .reduce((sum, p) => sum + p.targetSleeve, 0);
  if (increasing && otherTarget + appliedSleeve > 1 + 1e-9) {
    return { ok: false, error: "Paper book target sleeves exceed 100% gross. Reduce another sleeve or override lower." };
  }

  const now = input.now ?? new Date().toISOString();
  const equity = marked.metrics.equity;
  const targetValue = appliedSleeve * equity;
  const desiredUnits = targetValue / input.price;
  const currentUnits = current?.units ?? 0;
  const unitsDelta = desiredUnits - currentUnits;
  const cash = book.cash - unitsDelta * input.price;
  if (cash < -1e-7 && increasing) return { ok: false, error: "Paper fill would make normalized cash negative." };

  const soldUnits = unitsDelta < 0 ? Math.min(currentUnits, -unitsDelta) : 0;
  const realizedPnlDelta = current ? soldUnits * (input.price - current.avgPrice) : 0;
  const action: OpsAction = Math.abs(unitsDelta) <= 1e-10
    ? "LOG_ONLY"
    : appliedSleeve <= 1e-10
      ? "CLOSE"
      : current
        ? "RESIZE"
        : "OPEN";

  const nextPositions = book.positions.filter((p) => p.symbol !== input.symbol);
  if (appliedSleeve > 1e-10) {
    const avgPrice = current && unitsDelta > 0
      ? ((current.units * current.avgPrice) + (unitsDelta * input.price)) / desiredUnits
      : current?.avgPrice ?? input.price;
    nextPositions.push({
      symbol: input.symbol,
      name: input.name,
      assetClass: input.assetClass,
      units: desiredUnits,
      avgPrice,
      lastPrice: input.price,
      targetSleeve: appliedSleeve,
      openedAt: current?.openedAt ?? now,
      updatedAt: now,
    });
  }

  const nextBase: SergeantBook = {
    ...book,
    cash: Math.max(0, cash),
    realizedPnl: book.realizedPnl + realizedPnlDelta,
    positions: nextPositions,
    updatedAt: now,
  };
  const nextMarked = markBook(nextBase, Object.fromEntries(nextPositions.map((p) => [p.symbol, p.lastPrice])));

  const row: OpsLogRow = {
    id: input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    t: now,
    action,
    symbol: input.symbol,
    score: input.score,
    flag: input.flag,
    suggestedSleeve,
    appliedSleeve,
    price: input.price,
    unitsDelta,
    realizedPnlDelta,
    equityAfter: nextMarked.metrics.equity,
    reason: input.reason.trim() || (decreasing ? "Policy-aligned reduction" : "Policy-aligned paper posture"),
    details: "",
    formulaId: BTD_FORMULA_ID,
    policyId: SERGEANT_POLICY_ID,
    feedState: input.feedState,
  };

  return {
    ok: true,
    row,
    book: {
      ...nextBase,
      positions: nextMarked.positions,
      peakEquity: nextMarked.nextPeak,
      log: [row, ...book.log].slice(0, MAX_LOG_ROWS),
    },
  };
}

export function withMarkedPrices(book: SergeantBook, prices: Record<string, number>, now = new Date().toISOString()): SergeantBook {
  const marked = markBook(book, prices);
  const changedPrice = marked.positions.some((p, i) => p.lastPrice !== book.positions[i]?.lastPrice);
  const changedPeak = Math.abs(marked.nextPeak - book.peakEquity) > 1e-9;
  if (!changedPrice && !changedPeak) return book;
  return { ...book, positions: marked.positions, peakEquity: marked.nextPeak, updatedAt: now };
}

export function isRiskLoosening(before: KillConfig, after: KillConfig): boolean {
  return after.maxDrawdownPct > before.maxDrawdownPct + 1e-9
    || after.maxNames > before.maxNames
    || after.maxSleevePct > before.maxSleevePct + 1e-9
    || (before.globalHalt && !after.globalHalt);
}

export type KillChangeResult =
  | { ok: true; book: SergeantBook; row: OpsLogRow }
  | { ok: false; error: string };

export function changeKillConfig(
  book: SergeantBook,
  nextInput: KillConfig,
  reason = "",
  now = new Date().toISOString(),
  id?: string,
): KillChangeResult {
  const next = normalizeKills(nextInput);
  const same = next.maxDrawdownPct === book.kills.maxDrawdownPct
    && next.maxNames === book.kills.maxNames
    && next.maxSleevePct === book.kills.maxSleevePct
    && next.globalHalt === book.kills.globalHalt;
  if (same) return { ok: false, error: "No kill-control change to apply." };
  if (isRiskLoosening(book.kills, next) && !reason.trim()) {
    return { ok: false, error: "A reason is required when loosening risk controls or resuming from global halt." };
  }

  const details = [
    `DD ${book.kills.maxDrawdownPct}%→${next.maxDrawdownPct}%`,
    `names ${book.kills.maxNames}→${next.maxNames}`,
    `sleeve ${book.kills.maxSleevePct}%→${next.maxSleevePct}%`,
    `halt ${book.kills.globalHalt ? "ON" : "OFF"}→${next.globalHalt ? "ON" : "OFF"}`,
  ].join(" · ");
  const row: OpsLogRow = {
    id: id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    t: now,
    action: "KILL_CHANGE",
    symbol: null,
    score: null,
    flag: null,
    suggestedSleeve: null,
    appliedSleeve: null,
    price: null,
    unitsDelta: null,
    realizedPnlDelta: null,
    equityAfter: markBook(book, {}).metrics.equity,
    reason: reason.trim() || "Risk controls tightened",
    details,
    formulaId: BTD_FORMULA_ID,
    policyId: SERGEANT_POLICY_ID,
    feedState: null,
  };
  return {
    ok: true,
    row,
    book: {
      ...book,
      kills: next,
      log: [row, ...book.log].slice(0, MAX_LOG_ROWS),
      updatedAt: now,
    },
  };
}

function sanitizePosition(value: unknown, now: string): PaperPosition | null {
  if (!isRecord(value)) return null;
  const symbol = textValue(value.symbol).trim().toUpperCase();
  const units = finite(value.units, -1);
  const avgPrice = finite(value.avgPrice, -1);
  const lastPrice = finite(value.lastPrice, -1);
  if (!symbol || units < 0 || avgPrice <= 0 || lastPrice <= 0) return null;
  return {
    symbol,
    name: textValue(value.name, symbol).slice(0, 160),
    assetClass: textValue(value.assetClass, "Unknown").slice(0, 80),
    units,
    avgPrice,
    lastPrice,
    targetSleeve: finiteIn(value.targetSleeve, 0, 1, 0),
    openedAt: isoValue(value.openedAt, now),
    updatedAt: isoValue(value.updatedAt, now),
  };
}

function sanitizeLogRow(value: unknown, now: string): OpsLogRow | null {
  if (!isRecord(value) || !validAction(value.action)) return null;
  const nullableNumber = (x: unknown): number | null => typeof x === "number" && Number.isFinite(x) ? x : null;
  const score = nullableNumber(value.score);
  const suggested = nullableNumber(value.suggestedSleeve);
  const applied = nullableNumber(value.appliedSleeve);
  return {
    id: textValue(value.id, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).slice(0, 120),
    t: isoValue(value.t, now),
    action: value.action,
    symbol: typeof value.symbol === "string" && value.symbol.trim() ? value.symbol.trim().toUpperCase().slice(0, 40) : null,
    score: score === null ? null : finiteIn(score, 0, 100, 0),
    flag: validFlag(value.flag) ? value.flag : null,
    suggestedSleeve: suggested === null ? null : clampSleeve(suggested),
    appliedSleeve: applied === null ? null : clampSleeve(applied),
    price: nullableNumber(value.price),
    unitsDelta: nullableNumber(value.unitsDelta),
    realizedPnlDelta: nullableNumber(value.realizedPnlDelta),
    equityAfter: nullableNumber(value.equityAfter),
    reason: textValue(value.reason).slice(0, 500),
    details: textValue(value.details).slice(0, 1000),
    formulaId: textValue(value.formulaId, BTD_FORMULA_ID).slice(0, 80),
    policyId: textValue(value.policyId, SERGEANT_POLICY_ID).slice(0, 80),
    feedState: validFeedState(value.feedState) ? value.feedState : null,
  };
}

function sanitizeKills(value: unknown): KillConfig {
  if (!isRecord(value)) return { ...SERGEANT_DEFAULTS.kills };
  return normalizeKills({
    maxDrawdownPct: finite(value.maxDrawdownPct, SERGEANT_DEFAULTS.kills.maxDrawdownPct),
    maxNames: finite(value.maxNames, SERGEANT_DEFAULTS.kills.maxNames),
    maxSleevePct: finite(value.maxSleevePct, SERGEANT_DEFAULTS.kills.maxSleevePct),
    globalHalt: Boolean(value.globalHalt),
  });
}

function sanitizeBook(value: unknown, now: string, migrated: boolean): SergeantBook | null {
  if (!isRecord(value) || value.formulaId !== BTD_FORMULA_ID) return null;
  const rawPositions = Array.isArray(value.positions) ? value.positions : [];
  const deduped = new Map<string, PaperPosition>();
  for (const raw of rawPositions) {
    const p = sanitizePosition(raw, now);
    if (p && !deduped.has(p.symbol)) deduped.set(p.symbol, p);
  }
  const positions = [...deduped.values()];
  const rawLog = Array.isArray(value.log) ? value.log : [];
  const log = rawLog.map((row) => sanitizeLogRow(row, now)).filter((row): row is OpsLogRow => !!row).slice(0, MAX_LOG_ROWS);
  const cash = Math.max(0, finite(value.cash, UNIT_BOOK));
  const realizedPnl = migrated ? 0 : finite(value.realizedPnl, 0);
  const draft: SergeantBook = {
    schemaVersion: SERGEANT_SCHEMA_VERSION,
    formulaId: BTD_FORMULA_ID,
    policyId: SERGEANT_POLICY_ID,
    cash,
    peakEquity: Math.max(0, finite(value.peakEquity, UNIT_BOOK)),
    realizedPnl,
    positions,
    log,
    kills: sanitizeKills(value.kills),
    updatedAt: isoValue(value.updatedAt, now),
  };
  const marked = markBook(draft, {});
  return { ...draft, peakEquity: Math.max(draft.peakEquity, marked.metrics.equity) };
}

export function loadSergeantBook(storage: StorageReader | null, now = new Date().toISOString()): LoadBookResult {
  if (!storage) return { book: defaultBook(now), status: "fresh", warning: "Persistent storage unavailable; running ephemeral." };
  try {
    const raw = storage.getItem(SERGEANT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (isRecord(parsed) && parsed.schemaVersion === SERGEANT_SCHEMA_VERSION) {
        const book = sanitizeBook(parsed, now, false);
        if (book) return { book, status: "loaded", warning: null };
      }
      return { book: defaultBook(now), status: "recovered", warning: "Stored Sergeant v2 data was invalid/incompatible and was reset safely." };
    }

    const legacyRaw = storage.getItem(SERGEANT_LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as unknown;
      if (isRecord(parsed) && parsed.schemaVersion === 1) {
        const book = sanitizeBook(parsed, now, true);
        if (book) {
          return {
            book,
            status: "migrated",
            warning: "Migrated Sergeant v1 browser book to schema v2. Legacy realized P/L starts at 0 because v1 did not record it.",
          };
        }
      }
      return { book: defaultBook(now), status: "recovered", warning: "Legacy Sergeant storage was invalid/incompatible and was not imported." };
    }

    return { book: defaultBook(now), status: "fresh", warning: null };
  } catch {
    return { book: defaultBook(now), status: "recovered", warning: "Sergeant storage could not be read; running from a fresh local book." };
  }
}

export function saveSergeantBook(storage: StorageWriter | null, book: SergeantBook): SaveBookResult {
  if (!storage) return { ok: false, error: "Persistent storage unavailable." };
  try {
    storage.setItem(SERGEANT_STORAGE_KEY, JSON.stringify(book));
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not persist Sergeant book to localStorage." };
  }
}

function csvCell(value: string | number | null): string {
  if (value === null) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function opsLogCsv(rows: OpsLogRow[]): string {
  const header = [
    "timestamp", "action", "symbol", "score", "flag", "suggested_sleeve_pct", "applied_sleeve_pct",
    "price", "units_delta", "realized_pnl_delta", "equity_after", "reason", "details", "feed_state", "formula_id", "policy_id",
  ];
  const body = rows.map((r) => [
    r.t,
    r.action,
    r.symbol,
    r.score,
    r.flag,
    r.suggestedSleeve === null ? null : (r.suggestedSleeve * 100).toFixed(2),
    r.appliedSleeve === null ? null : (r.appliedSleeve * 100).toFixed(2),
    r.price,
    r.unitsDelta,
    r.realizedPnlDelta,
    r.equityAfter,
    r.reason,
    r.details,
    r.feedState,
    r.formulaId,
    r.policyId,
  ]);
  return [header, ...body].map((row) => row.map(csvCell).join(",")).join("\n");
}
