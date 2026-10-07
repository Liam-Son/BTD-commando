"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sergeant_risk_1 = require("./lib/sergeant-risk");
const desk_context_1 = require("./lib/sergeant-chat/desk_context");
const t0 = "2026-10-07T00:00:00.000Z";
const book = { schemaVersion: 2, formulaId: "btd_v1_0", policyId: "sergeant_policy_v1", cash: 80, peakEquity: 100, realizedPnl: 0, positions: [{ symbol: "SPY", name: "SPY", assetClass: "ETF", units: 0.2, avgPrice: 100, lastPrice: 100, targetSleeve: 0.2, openedAt: t0, updatedAt: t0 }], log: [], kills: { maxDrawdownPct: 10, maxNames: 10, maxSleevePct: 20, globalHalt: false }, updatedAt: t0 };
const metrics = { equity: 100, positionValue: 20, grossExposure: 0.2, targetGrossPct: 20, drawdownPct: 0, activeNames: 1, maxSingleSleevePct: 20, unrealizedPnl: 0, realizedPnl: 0 };
const kills = { globalHalt: false, drawdown: false, names: false, sleeve: false, any: false, reasons: [] };
const risk = (0, sergeant_risk_1.assessSergeantRisk)({ book, metrics, kills, feedState: "live", inputReliability: 100 });
if (risk.engineId !== "sergeant_risk_v2")
    throw new Error("risk engine version not bumped");
if (risk.paperRiskCeilingPct !== 20)
    throw new Error(`one capped name globally froze ceiling: ${risk.paperRiskCeilingPct}`);
if (risk.posture !== "CAUTION")
    throw new Error(`expected CAUTION at concentration cap, got ${risk.posture}`);
if (!(0, sergeant_risk_1.sergeantRiskCeilingBlocksIncrease)(0.2, 0.21, risk))
    throw new Error("increase above cap was not blocked");
if ((0, sergeant_risk_1.sergeantRiskCeilingBlocksIncrease)(0.2, 0.15, risk))
    throw new Error("reduction escape hatch broken");
const freshMetrics = { ...metrics, positionValue: 0, grossExposure: 0, targetGrossPct: 0, activeNames: 0, maxSingleSleevePct: 0 };
const freshBook = { ...book, cash: 100, positions: [] };
const freshRisk = (0, sergeant_risk_1.assessSergeantRisk)({ book: freshBook, metrics: freshMetrics, kills, feedState: "live", inputReliability: 100 });
if (freshRisk.posture !== "CLEAR" || freshRisk.paperRiskCeilingPct !== 20)
    throw new Error("clean book regression");
const downRisk = (0, sergeant_risk_1.assessSergeantRisk)({ book: freshBook, metrics: freshMetrics, kills, feedState: "down", inputReliability: 100 });
if (downRisk.posture !== "NO INCREASE" || downRisk.paperRiskCeilingPct !== 0)
    throw new Error("DOWN feed regression");
const namesOnly = { globalHalt: false, drawdown: false, names: true, sleeve: false, any: true, reasons: ["Active names 10 at/above limit 10"] };
const namesMetrics = { ...metrics, activeNames: 10, maxSingleSleevePct: 5, grossExposure: 0.5, positionValue: 50 };
const namesRisk = (0, sergeant_risk_1.assessSergeantRisk)({ book, metrics: namesMetrics, kills: namesOnly, feedState: "live", inputReliability: 100 });
if (namesRisk.posture !== "CAUTION" || namesRisk.paperRiskCeilingPct !== 20)
    throw new Error("names-only limit incorrectly caused global freeze");
const ctx = (0, desk_context_1.buildSergeantDeskContext)({ book, metrics, kills, risk, selected: { symbol: "SPY", btdScore: 72.3, confidence: 100, flag: "ACQUIRE", currentSleevePct: 20, requestedSleevePct: 10 }, generatedAt: t0 });
const safe = (0, desk_context_1.sanitizeSergeantDeskContext)(ctx);
if (!safe)
    throw new Error("valid v2 context rejected");
const stale = JSON.parse(JSON.stringify(ctx));
stale.risk.engineId = "sergeant_risk_v1";
if ((0, desk_context_1.sanitizeSergeantDeskContext)(stale) !== null)
    throw new Error("stale v1 risk context accepted");
const tampered = JSON.parse(JSON.stringify(ctx));
tampered.risk.paperRiskCeilingPct = 9999;
const bounded = (0, desk_context_1.sanitizeSergeantDeskContext)(tampered);
if (!bounded || bounded.risk.paperRiskCeilingPct !== 20)
    throw new Error("desk ceiling sanitization is not capped at 20");
const health = (0, desk_context_1.contextualSergeantDeskReply)("How is my paper book?", safe);
if (!health?.message.includes("paper-only"))
    throw new Error("missing trust-boundary copy");
console.log(JSON.stringify({ engine: risk.engineId, atCap: { posture: risk.posture, health: risk.bookHealth, ceiling: risk.paperRiskCeilingPct }, fresh: { posture: freshRisk.posture, ceiling: freshRisk.paperRiskCeilingPct }, down: { posture: downRisk.posture, ceiling: downRisk.paperRiskCeilingPct }, namesOnly: { posture: namesRisk.posture, ceiling: namesRisk.paperRiskCeilingPct }, reductionEscape: true, staleContextRejected: true, tamperedCeilingBounded: bounded.risk.paperRiskCeilingPct }, null, 2));
