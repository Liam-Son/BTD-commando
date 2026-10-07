import { describe, expect, it } from "vitest";
import { defaultBook, markBook, evaluateKills } from "../sergeant";
import { assessSergeantRisk } from "../sergeant-risk";
import {
  buildSergeantDeskContext,
  contextualSergeantDeskReply,
  sanitizeSergeantDeskContext,
  SERGEANT_DESK_CONTEXT_ID,
} from "./desk_context";

function context(overrides: { feedState?: "live" | "snapshot" | "degraded" | "down"; confidence?: number } = {}) {
  const book = defaultBook("2026-10-07T00:00:00.000Z");
  const marked = markBook(book, {});
  const kills = evaluateKills(book, marked.metrics);
  const feedState = overrides.feedState ?? "live";
  const risk = assessSergeantRisk({
    book,
    metrics: marked.metrics,
    kills,
    feedState,
    inputReliability: overrides.confidence ?? 80,
  });
  return buildSergeantDeskContext({
    book,
    metrics: marked.metrics,
    kills,
    risk,
    selected: {
      symbol: "SPY",
      btdScore: 72.3,
      confidence: overrides.confidence ?? 80,
      flag: "ACQUIRE",
      currentSleevePct: 0,
      requestedSleevePct: 10,
    },
    generatedAt: "2026-10-07T00:00:00.000Z",
  });
}

describe("Sergeant SP3 desk context", () => {
  it("builds a versioned paper-only snapshot", () => {
    const c = context();
    expect(c.contextId).toBe(SERGEANT_DESK_CONTEXT_ID);
    expect(c.formulaId).toBe("btd_v1_0");
    expect(c.policyId).toBe("sergeant_policy_v1");
    expect(c.selected?.symbol).toBe("SPY");
  });

  it("sanitizes valid context and rejects incompatible versions", () => {
    const c = context();
    expect(sanitizeSergeantDeskContext(c)?.selected?.symbol).toBe("SPY");
    expect(sanitizeSergeantDeskContext({ ...c, formulaId: "other" })).toBeNull();
    expect(sanitizeSergeantDeskContext({ ...c, source: "broker" })).toBeNull();
  });

  it("clamps tampered numeric fields instead of trusting them", () => {
    const c: any = context();
    c.book.grossExposurePct = 9999;
    c.risk.paperRiskCeilingPct = 9999;
    const safe = sanitizeSergeantDeskContext(c);
    expect(safe?.book.grossExposurePct).toBe(100);
    expect(safe?.risk.paperRiskCeilingPct).toBe(100);
  });

  it("answers book-health questions from deterministic context", () => {
    const reply = contextualSergeantDeskReply("How is my paper book?", context());
    expect(reply?.topic).toBe("desk_health");
    expect(reply?.message).toContain("health");
    expect(reply?.message).toContain("paper-only");
  });

  it("explains the risk ceiling without turning it into a recommendation", () => {
    const reply = contextualSergeantDeskReply("What is my paper risk ceiling?", context());
    expect(reply?.topic).toBe("desk_ceiling");
    expect(reply?.message).toContain("safety cap");
    expect(reply?.message).toContain("not a recommended position size");
  });

  it("can explain paper increase eligibility but never mutates state", () => {
    const reply = contextualSergeantDeskReply("Can I increase this position?", context({ feedState: "down" }));
    expect(reply?.topic).toBe("desk_increase_rule");
    expect(reply?.message).toContain("blocks new or increased paper exposure");
    expect(reply?.message).toContain("chat does not change the book");
  });

  it("reports deterministic stress as a scenario, not a forecast", () => {
    const c: any = context();
    c.risk.stress = [{ id: "book_down_20", label: "All paper positions −20%", estimatedEquity: 92, estimatedLossPct: 8 }];
    const reply = contextualSergeantDeskReply("What happens if the book drops 20%?", c);
    expect(reply?.topic).toBe("desk_stress");
    expect(reply?.message).toContain("NAV 92.00");
    expect(reply?.message).toContain("not a forecast");
  });

  it("returns null when no deterministic desk context is supplied", () => {
    expect(contextualSergeantDeskReply("How is my book?", null)).toBeNull();
  });
});
