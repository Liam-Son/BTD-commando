"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const sergeant_1 = require("../sergeant");
const sergeant_risk_1 = require("../sergeant-risk");
const desk_context_1 = require("./desk_context");
function context(overrides = {}) {
    const book = (0, sergeant_1.defaultBook)("2026-10-07T00:00:00.000Z");
    const marked = (0, sergeant_1.markBook)(book, {});
    const kills = (0, sergeant_1.evaluateKills)(book, marked.metrics);
    const feedState = overrides.feedState ?? "live";
    const risk = (0, sergeant_risk_1.assessSergeantRisk)({
        book,
        metrics: marked.metrics,
        kills,
        feedState,
        inputReliability: overrides.confidence ?? 80,
    });
    return (0, desk_context_1.buildSergeantDeskContext)({
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
(0, vitest_1.describe)("Sergeant SP3 desk context", () => {
    (0, vitest_1.it)("builds a versioned paper-only snapshot", () => {
        const c = context();
        (0, vitest_1.expect)(c.contextId).toBe(desk_context_1.SERGEANT_DESK_CONTEXT_ID);
        (0, vitest_1.expect)(c.formulaId).toBe("btd_v1_0");
        (0, vitest_1.expect)(c.policyId).toBe("sergeant_policy_v1");
        (0, vitest_1.expect)(c.selected?.symbol).toBe("SPY");
    });
    (0, vitest_1.it)("sanitizes valid context and rejects incompatible versions", () => {
        const c = context();
        (0, vitest_1.expect)((0, desk_context_1.sanitizeSergeantDeskContext)(c)?.selected?.symbol).toBe("SPY");
        (0, vitest_1.expect)((0, desk_context_1.sanitizeSergeantDeskContext)({ ...c, formulaId: "other" })).toBeNull();
        (0, vitest_1.expect)((0, desk_context_1.sanitizeSergeantDeskContext)({ ...c, source: "broker" })).toBeNull();
    });
    (0, vitest_1.it)("rejects stale v1 risk-engine context after the SP4 semantic fix", () => {
        const c = context();
        c.risk.engineId = "sergeant_risk_v1";
        (0, vitest_1.expect)((0, desk_context_1.sanitizeSergeantDeskContext)(c)).toBeNull();
    });
    (0, vitest_1.it)("clamps tampered numeric fields instead of trusting them", () => {
        const c = context();
        c.book.grossExposurePct = 9999;
        c.risk.paperRiskCeilingPct = 9999;
        const safe = (0, desk_context_1.sanitizeSergeantDeskContext)(c);
        (0, vitest_1.expect)(safe?.book.grossExposurePct).toBe(100);
        (0, vitest_1.expect)(safe?.risk.paperRiskCeilingPct).toBe(20);
    });
    (0, vitest_1.it)("answers book-health questions from deterministic context", () => {
        const reply = (0, desk_context_1.contextualSergeantDeskReply)("How is my paper book?", context());
        (0, vitest_1.expect)(reply?.topic).toBe("desk_health");
        (0, vitest_1.expect)(reply?.message).toContain("health");
        (0, vitest_1.expect)(reply?.message).toContain("paper-only");
    });
    (0, vitest_1.it)("explains the risk ceiling without turning it into a recommendation", () => {
        const reply = (0, desk_context_1.contextualSergeantDeskReply)("What is my paper risk ceiling?", context());
        (0, vitest_1.expect)(reply?.topic).toBe("desk_ceiling");
        (0, vitest_1.expect)(reply?.message).toContain("safety cap");
        (0, vitest_1.expect)(reply?.message).toContain("not a recommended position size");
    });
    (0, vitest_1.it)("can explain paper increase eligibility but never mutates state", () => {
        const reply = (0, desk_context_1.contextualSergeantDeskReply)("Can I increase this position?", context({ feedState: "down" }));
        (0, vitest_1.expect)(reply?.topic).toBe("desk_increase_rule");
        (0, vitest_1.expect)(reply?.message).toContain("blocks new or increased paper exposure");
        (0, vitest_1.expect)(reply?.message).toContain("chat does not change the book");
    });
    (0, vitest_1.it)("reports deterministic stress as a scenario, not a forecast", () => {
        const c = context();
        c.risk.stress = [{ id: "book_down_20", label: "All paper positions −20%", estimatedEquity: 92, estimatedLossPct: 8 }];
        const reply = (0, desk_context_1.contextualSergeantDeskReply)("What happens if the book drops 20%?", c);
        (0, vitest_1.expect)(reply?.topic).toBe("desk_stress");
        (0, vitest_1.expect)(reply?.message).toContain("NAV 92.00");
        (0, vitest_1.expect)(reply?.message).toContain("not a forecast");
    });
    (0, vitest_1.it)("returns null when no deterministic desk context is supplied", () => {
        (0, vitest_1.expect)((0, desk_context_1.contextualSergeantDeskReply)("How is my book?", null)).toBeNull();
    });
});
