"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultBook = defaultBook;
exports.markBook = markBook;
exports.evaluateKills = evaluateKills;
function defaultBook(now = "2026-10-07T00:00:00.000Z") { return { schemaVersion: 2, formulaId: "btd_v1_0", policyId: "sergeant_policy_v1", cash: 100, peakEquity: 100, realizedPnl: 0, positions: [], log: [], kills: { maxDrawdownPct: 10, maxNames: 10, maxSleevePct: 20, globalHalt: false }, updatedAt: now }; }
function markBook(book, prices) { const positions = book.positions; const positionValue = positions.reduce((s, p) => s + p.units * p.lastPrice, 0); const equity = book.cash + positionValue; return { positions, metrics: { equity, positionValue, grossExposure: equity ? positionValue / equity : 0, targetGrossPct: positions.reduce((s, p) => s + p.targetSleeve * 100, 0), drawdownPct: book.peakEquity ? Math.max(0, (book.peakEquity - equity) / book.peakEquity * 100) : 0, activeNames: positions.length, maxSingleSleevePct: equity && positions.length ? Math.max(...positions.map(p => p.units * p.lastPrice / equity * 100)) : 0, unrealizedPnl: 0, realizedPnl: book.realizedPnl }, nextPeak: Math.max(book.peakEquity, equity) }; }
function evaluateKills(book, metrics) { const drawdown = metrics.drawdownPct >= book.kills.maxDrawdownPct; const names = metrics.activeNames >= book.kills.maxNames; const sleeve = metrics.maxSingleSleevePct > book.kills.maxSleevePct; const globalHalt = book.kills.globalHalt; return { drawdown, names, sleeve, globalHalt, any: drawdown || names || sleeve || globalHalt, reasons: [] }; }
