import { describe, expect, it } from "vitest";
import {
  BTD_FORMULA_ID,
  SERGEANT_POLICY_ID,
  SERGEANT_STORAGE_KEY,
  changeKillConfig,
  defaultBook,
  evaluateKills,
  flagFromScore,
  isRiskLoosening,
  loadSergeantBook,
  markBook,
  opsLogCsv,
  rebalancePaperPosition,
  saveSergeantBook,
  sleeveFromFlag,
  type SergeantBook,
} from "./sergeant";

const t0 = "2026-09-30T00:00:00.000Z";

function paper(book: SergeantBook, overrides: Partial<Parameters<typeof rebalancePaperPosition>[1]> = {}) {
  return rebalancePaperPosition(book, {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF",
    assetClass: "ETF",
    price: 100,
    score: 70,
    flag: "ACQUIRE",
    suggestedSleeve: 1,
    appliedSleeve: 1,
    reason: "",
    feedState: "live",
    now: t0,
    id: "test-row",
    ...overrides,
  });
}

describe("Sergeant policy v1", () => {
  it("keeps the frozen score bands and sleeves", () => {
    expect(SERGEANT_POLICY_ID).toBe("sergeant_policy_v1");
    expect(BTD_FORMULA_ID).toBe("btd_v1_0");
    expect(flagFromScore(65)).toBe("ACQUIRE");
    expect(flagFromScore(50)).toBe("WATCH");
    expect(flagFromScore(35.1)).toBe("REDUCE");
    expect(flagFromScore(35)).toBe("STAND DOWN");
    expect(sleeveFromFlag("ACQUIRE")).toBe(1);
    expect(sleeveFromFlag("WATCH")).toBe(0.5);
    expect(sleeveFromFlag("REDUCE")).toBe(0.25);
    expect(sleeveFromFlag("STAND DOWN")).toBe(0.1);
  });

  it("rejects a mismatched flag or suggested sleeve", () => {
    const book = defaultBook(t0);
    expect(paper(book, { flag: "WATCH" }).ok).toBe(false);
    expect(paper(book, { suggestedSleeve: 0.5 }).ok).toBe(false);
  });

  it("requires a reason for a sleeve override", () => {
    const result = paper(defaultBook(t0), { appliedSleeve: 0.5, reason: "" });
    expect(result.ok).toBe(false);
  });

  it("blocks increases on feed DOWN but still allows reductions", () => {
    const blocked = paper(defaultBook(t0), { feedState: "down" });
    expect(blocked.ok).toBe(false);

    const opened = paper(defaultBook(t0));
    expect(opened.ok).toBe(true);
    if (opened.ok === false) return;
    const reduced = paper(opened.book, {
      feedState: "down",
      appliedSleeve: 0.5,
      reason: "feed down risk reduction",
      now: "2026-09-30T00:01:00.000Z",
      id: "reduce",
    });
    expect(reduced.ok).toBe(true);
  });

  it("global halt blocks increases but allows a close", () => {
    const opened = paper(defaultBook(t0));
    expect(opened.ok).toBe(true);
    if (opened.ok === false) return;
    const halted = changeKillConfig(opened.book, { ...opened.book.kills, globalHalt: true }, "");
    expect(halted.ok).toBe(true);
    if (halted.ok === false) return;

    const increase = paper(halted.book, { appliedSleeve: 1, now: "2026-09-30T00:01:00.000Z", id: "noop" });
    expect(increase.ok).toBe(true); // no increase; log-only is allowed

    const closed = paper(halted.book, {
      appliedSleeve: 0,
      reason: "manual risk-off",
      now: "2026-09-30T00:02:00.000Z",
      id: "close",
    });
    expect(closed.ok).toBe(true);
  });

  it("drawdown kill trips at the configured threshold", () => {
    const opened = paper(defaultBook(t0));
    expect(opened.ok).toBe(true);
    if (opened.ok === false) return;
    const marked = markBook(opened.book, { SPY: 89 });
    const kills = evaluateKills(opened.book, marked.metrics);
    expect(marked.metrics.drawdownPct).toBeGreaterThanOrEqual(10);
    expect(kills.drawdown).toBe(true);
  });

  it("detects concentration from actual marked exposure, not just the stored target", () => {
    const opened = paper(defaultBook(t0), { appliedSleeve: 0.5, reason: "half sleeve" });
    expect(opened.ok).toBe(true);
    if (opened.ok === false) return;
    const tightened = changeKillConfig(opened.book, { ...opened.book.kills, maxSleevePct: 55 }, "");
    expect(tightened.ok).toBe(true);
    if (tightened.ok === false) return;
    const marked = markBook(tightened.book, { SPY: 130 });
    const kills = evaluateKills(tightened.book, marked.metrics);
    expect(marked.metrics.maxSingleSleevePct).toBeGreaterThan(55);
    expect(kills.sleeve).toBe(true);
  });

  it("allows a reduction even when the new target is still above a tightened sleeve cap", () => {
    const opened = paper(defaultBook(t0));
    expect(opened.ok).toBe(true);
    if (opened.ok === false) return;
    const tightened = changeKillConfig(opened.book, { ...opened.book.kills, maxSleevePct: 50 }, "tighten concentration");
    expect(tightened.ok).toBe(true);
    if (tightened.ok === false) return;
    const reduced = paper(tightened.book, {
      appliedSleeve: 0.75,
      reason: "step-down toward cap",
      now: "2026-09-30T00:03:00.000Z",
      id: "step-down",
    });
    expect(reduced.ok).toBe(true);
  });

  it("requires a reason to loosen risk controls and logs accepted changes", () => {
    const book = defaultBook(t0);
    expect(isRiskLoosening(book.kills, { ...book.kills, maxDrawdownPct: 20 })).toBe(true);
    const rejected = changeKillConfig(book, { ...book.kills, maxDrawdownPct: 20 }, "");
    expect(rejected.ok).toBe(false);

    const accepted = changeKillConfig(book, { ...book.kills, maxDrawdownPct: 20 }, "research exception", t0, "kill-1");
    expect(accepted.ok).toBe(true);
    if (accepted.ok === false) return;
    expect(accepted.row.action).toBe("KILL_CHANGE");
    expect(accepted.book.log[0]?.policyId).toBe(SERGEANT_POLICY_ID);
  });

  it("records realized P/L when reducing or closing", () => {
    const opened = paper(defaultBook(t0));
    expect(opened.ok).toBe(true);
    if (opened.ok === false) return;
    const closed = paper(opened.book, {
      price: 110,
      appliedSleeve: 0,
      reason: "close at gain",
      now: "2026-09-30T00:10:00.000Z",
      id: "close-gain",
    });
    expect(closed.ok).toBe(true);
    if (closed.ok === false) return;
    expect(closed.row.realizedPnlDelta).toBeCloseTo(10);
    expect(closed.book.realizedPnl).toBeCloseTo(10);
  });

  it("migrates the old v1 browser book into schema v2", () => {
    const legacy = {
      schemaVersion: 1,
      formulaId: "btd_v1_0",
      policyId: "sergeant_policy_v0",
      cash: 50,
      peakEquity: 100,
      positions: [{ symbol: "SPY", name: "SPY", assetClass: "ETF", units: 0.5, avgPrice: 100, lastPrice: 100, targetSleeve: 0.5, openedAt: t0, updatedAt: t0 }],
      log: [],
      kills: { maxDrawdownPct: 10, maxNames: 10, maxSleevePct: 100, globalHalt: false },
      updatedAt: t0,
    };
    const storage = {
      getItem(key: string) { return key === "btd.sergeant.v1" ? JSON.stringify(legacy) : null; },
    };
    const loaded = loadSergeantBook(storage, t0);
    expect(loaded.status).toBe("migrated");
    expect(loaded.book.schemaVersion).toBe(2);
    expect(loaded.book.policyId).toBe(SERGEANT_POLICY_ID);
    expect(loaded.book.positions[0]?.symbol).toBe("SPY");
  });

  it("recovers safely from malformed storage and reports save failures", () => {
    const badRead = { getItem() { return "{broken"; } };
    const loaded = loadSergeantBook(badRead, t0);
    expect(loaded.status).toBe("recovered");
    expect(loaded.book.cash).toBe(100);

    const badWrite = { setItem() { throw new Error("quota"); } };
    expect(saveSergeantBook(badWrite, defaultBook(t0)).ok).toBe(false);
  });

  it("exports paper and kill events to CSV", () => {
    const opened = paper(defaultBook(t0));
    expect(opened.ok).toBe(true);
    if (opened.ok === false) return;
    const halted = changeKillConfig(opened.book, { ...opened.book.kills, globalHalt: true }, "");
    expect(halted.ok).toBe(true);
    if (halted.ok === false) return;
    const csv = opsLogCsv(halted.book.log);
    expect(csv).toContain("KILL_CHANGE");
    expect(csv).toContain("SPY");
    expect(csv).toContain(SERGEANT_POLICY_ID);
  });

  it("writes the current schema key", () => {
    let writtenKey = "";
    const storage = { setItem(key: string) { writtenKey = key; } };
    expect(saveSergeantBook(storage, defaultBook(t0)).ok).toBe(true);
    expect(writtenKey).toBe(SERGEANT_STORAGE_KEY);
  });
});
