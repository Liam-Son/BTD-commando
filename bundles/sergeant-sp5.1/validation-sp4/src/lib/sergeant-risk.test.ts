import { describe, expect, it } from "vitest";
import type { BookMetrics, KillState, SergeantBook } from "./sergeant";
import {
  assessSergeantRisk,
  sergeantPaperRiskCeilingPct,
  sergeantRiskCeilingBlocksIncrease,
  stressSergeantBook,
} from "./sergeant-risk";

const t0 = "2026-10-07T00:00:00.000Z";

function book(overrides: Partial<SergeantBook> = {}): SergeantBook {
  return {
    schemaVersion: 2,
    formulaId: "btd_v1_0",
    policyId: "sergeant_policy_v1",
    cash: 100,
    peakEquity: 100,
    realizedPnl: 0,
    positions: [],
    log: [],
    kills: { maxDrawdownPct: 10, maxNames: 10, maxSleevePct: 20, globalHalt: false },
    updatedAt: t0,
    ...overrides,
  };
}

function metrics(overrides: Partial<BookMetrics> = {}): BookMetrics {
  return {
    equity: 100,
    positionValue: 0,
    grossExposure: 0,
    targetGrossPct: 0,
    drawdownPct: 0,
    activeNames: 0,
    maxSingleSleevePct: 0,
    unrealizedPnl: 0,
    realizedPnl: 0,
    ...overrides,
  };
}

function kills(overrides: Partial<KillState> = {}): KillState {
  return {
    globalHalt: false,
    drawdown: false,
    names: false,
    sleeve: false,
    any: false,
    reasons: [],
    ...overrides,
  };
}

describe("Sergeant deterministic risk engine", () => {
  it("keeps a clean live empty book at 100 health with a 20% safety ceiling", () => {
    const result = assessSergeantRisk({
      book: book(), metrics: metrics(), kills: kills(), feedState: "live", inputReliability: 100,
    });
    expect(result.bookHealth).toBe(100);
    expect(result.paperRiskCeilingPct).toBe(20);
    expect(result.posture).toBe("CLEAR");
  });

  it("never lets a worse drawdown improve book health", () => {
    const low = assessSergeantRisk({
      book: book(), metrics: metrics({ drawdownPct: 2 }), kills: kills(), feedState: "live", inputReliability: 90,
    });
    const high = assessSergeantRisk({
      book: book(), metrics: metrics({ drawdownPct: 8 }), kills: kills(), feedState: "live", inputReliability: 90,
    });
    expect(high.bookHealth).toBeLessThan(low.bookHealth);
    expect(high.paperRiskCeilingPct).toBeLessThanOrEqual(low.paperRiskCeilingPct);
  });

  it("never lets lower input reliability raise the paper-risk ceiling", () => {
    const high = sergeantPaperRiskCeilingPct(book(), metrics(), kills(), "live", 90);
    const low = sergeantPaperRiskCeilingPct(book(), metrics(), kills(), "live", 40);
    expect(low).toBeLessThanOrEqual(high);
  });

  it("tightens monotonically as feed quality falls and blocks increases when DOWN", () => {
    const live = assessSergeantRisk({ book: book(), metrics: metrics(), kills: kills(), feedState: "live", inputReliability: 100 });
    const snapshot = assessSergeantRisk({ book: book(), metrics: metrics(), kills: kills(), feedState: "snapshot", inputReliability: 100 });
    const degraded = assessSergeantRisk({ book: book(), metrics: metrics(), kills: kills(), feedState: "degraded", inputReliability: 100 });
    const down = assessSergeantRisk({ book: book(), metrics: metrics(), kills: kills(), feedState: "down", inputReliability: 100 });
    expect(snapshot.paperRiskCeilingPct).toBeLessThanOrEqual(live.paperRiskCeilingPct);
    expect(degraded.paperRiskCeilingPct).toBeLessThanOrEqual(snapshot.paperRiskCeilingPct);
    expect(down.paperRiskCeilingPct).toBe(0);
    expect(down.posture).toBe("NO INCREASE");
  });

  it("penalizes concentration in health without globally freezing unrelated names", () => {
    const low = assessSergeantRisk({
      book: book(),
      metrics: metrics({ activeNames: 1, maxSingleSleevePct: 5, grossExposure: 0.05, positionValue: 5 }),
      kills: kills(), feedState: "live", inputReliability: 100,
    });
    const high = assessSergeantRisk({
      book: book(),
      metrics: metrics({ activeNames: 1, maxSingleSleevePct: 19, grossExposure: 0.19, positionValue: 19 }),
      kills: kills(), feedState: "live", inputReliability: 100,
    });
    expect(high.bookHealth).toBeLessThan(low.bookHealth);
    expect(high.paperRiskCeilingPct).toBe(20);
    expect(high.posture).toBe("CAUTION");
  });

  it("does not collapse the global per-name ceiling when one existing name is exactly at its cap", () => {
    const result = assessSergeantRisk({
      book: book(),
      metrics: metrics({ activeNames: 1, maxSingleSleevePct: 20, grossExposure: 0.20, positionValue: 20 }),
      kills: kills(), feedState: "live", inputReliability: 100,
    });
    expect(result.paperRiskCeilingPct).toBe(20);
    expect(result.posture).toBe("CAUTION");
    expect(result.reasons.join(" ")).toContain("100% of the configured sleeve cap");
  });

  it("does not globally freeze existing-name increases when only the max-names limit is reached", () => {
    const result = assessSergeantRisk({
      book: book(),
      metrics: metrics({ activeNames: 10, maxSingleSleevePct: 5, grossExposure: 0.50, positionValue: 50 }),
      kills: kills({ names: true, any: true, reasons: ["Active names 10 at/above limit 10"] }),
      feedState: "live", inputReliability: 100,
    });
    expect(result.paperRiskCeilingPct).toBe(20);
    expect(result.posture).toBe("CAUTION");
    expect(result.reasons.join(" ")).toContain("another new paper name is blocked");
  });

  it("forces NO INCREASE when an existing kill state is tripped", () => {
    const result = assessSergeantRisk({
      book: book(), metrics: metrics({ drawdownPct: 10 }),
      kills: kills({ drawdown: true, any: true, reasons: ["Book drawdown 10.0% ≥ 10.0%"] }),
      feedState: "live", inputReliability: 100,
    });
    expect(result.paperRiskCeilingPct).toBe(0);
    expect(result.posture).toBe("NO INCREASE");
    expect(result.reasons.join(" ")).toContain("drawdown");
  });

  it("never expands above the fresh-book safety cap or a lower configured sleeve cap", () => {
    expect(sergeantPaperRiskCeilingPct(book(), metrics(), kills(), "live", 100, 20)).toBe(20);
    const tighter = book({ kills: { maxDrawdownPct: 10, maxNames: 10, maxSleevePct: 8, globalHalt: false } });
    expect(sergeantPaperRiskCeilingPct(tighter, metrics(), kills(), "live", 100, 20)).toBe(8);
  });

  it("uses conservative neutral reliability when confidence is missing", () => {
    const result = assessSergeantRisk({ book: book(), metrics: metrics(), kills: kills(), feedState: "live" });
    expect(result.reliabilityKnown).toBe(false);
    expect(result.inputReliability).toBe(50);
    expect(result.paperRiskCeilingPct).toBe(10);
    expect(result.reasons.join(" ")).toContain("unavailable");
  });



  it("blocks only increases above the deterministic ceiling and preserves the reduction escape hatch", () => {
    const brief = { paperRiskCeilingPct: 10 };
    expect(sergeantRiskCeilingBlocksIncrease(0.05, 0.08, brief)).toBe(false);
    expect(sergeantRiskCeilingBlocksIncrease(0.05, 0.12, brief)).toBe(true);
    expect(sergeantRiskCeilingBlocksIncrease(0.25, 0.20, brief)).toBe(false);
    expect(sergeantRiskCeilingBlocksIncrease(0.25, 0.30, brief)).toBe(true);
  });

  it("produces monotonic whole-book stress losses", () => {
    const b = book({
      cash: 50,
      positions: [{
        symbol: "SPY", name: "SPY", assetClass: "ETF", units: 0.5,
        avgPrice: 100, lastPrice: 100, targetSleeve: 0.5, openedAt: t0, updatedAt: t0,
      }],
    });
    const scenarios = stressSergeantBook(b);
    const d10 = scenarios.find((x) => x.id === "book_down_10")!;
    const d20 = scenarios.find((x) => x.id === "book_down_20")!;
    const d35 = scenarios.find((x) => x.id === "book_down_35")!;
    expect(d10.estimatedLossPct).toBeLessThan(d20.estimatedLossPct);
    expect(d20.estimatedLossPct).toBeLessThan(d35.estimatedLossPct);
    expect(d10.estimatedLossPct).toBeCloseTo(5);
    expect(d35.estimatedLossPct).toBeCloseTo(17.5);
  });

  it("adds a largest-position shock with the correct symbol", () => {
    const b = book({
      cash: 40,
      positions: [
        { symbol: "SPY", name: "SPY", assetClass: "ETF", units: 0.4, avgPrice: 100, lastPrice: 100, targetSleeve: 0.4, openedAt: t0, updatedAt: t0 },
        { symbol: "QQQ", name: "QQQ", assetClass: "ETF", units: 0.2, avgPrice: 100, lastPrice: 100, targetSleeve: 0.2, openedAt: t0, updatedAt: t0 },
      ],
    });
    const scenario = stressSergeantBook(b).find((x) => x.id === "largest_position_down_35");
    expect(scenario?.symbol).toBe("SPY");
    expect(scenario?.estimatedLossPct).toBeCloseTo(14);
  });
});
