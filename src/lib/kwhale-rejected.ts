export const KWHALE_REJECTED = {
  id: "kwhale_v5_1_rejected",
  title: "K-Whale v5.1 rejected research log",
  status: "REJECTED",
  window: { from: "2018-08-17", to: "2026-10-05" },
  metrics: {
    totalReturn: -0.4999014804019083,
    cagr: -0.08158253154680262,
    maxDrawdown: 0.5578364521225795,
    trades: 8,
    wins: 3,
    avgExposure: 0.034993270524899055,
    buyHoldCagr: 0.37695283553400194,
  },
  trades: [
    { entryFillDate: "2018-11-28", entryFillPrice: 3875.63, exitFillDate: "2018-12-08", exitFillPrice: 3403.57, exitReason: "stop", netTradeReturn: -0.12879972538175077, holdDays: 10 },
    { entryFillDate: "2020-03-12", entryFillPrice: 7934.58, exitFillDate: "2020-03-13", exitFillPrice: 4800.01, exitReason: "stop", netTradeReturn: -0.3998720904740347, holdDays: 1 },
    { entryFillDate: "2020-03-21", entryFillPrice: 6204.57, exitFillDate: "2020-04-11", exitFillPrice: 6858.92, exitReason: "max_hold", netTradeReturn: 0.09665411962408621, holdDays: 21 },
    { entryFillDate: "2021-09-26", entryFillPrice: 42670.63, exitFillDate: "2021-10-02", exitFillPrice: 48141.6, exitReason: "recovery_sma", netTradeReturn: 0.11922419691543107, holdDays: 6 },
    { entryFillDate: "2022-05-15", entryFillPrice: 30086.74, exitFillDate: "2022-06-05", exitFillPrice: 29864.03, exitReason: "max_hold", netTradeReturn: -0.015311409558043776, holdDays: 21 },
    { entryFillDate: "2022-06-16", entryFillPrice: 22583.72, exitFillDate: "2022-06-19", exitFillPrice: 18970.79, exitReason: "stop", netTradeReturn: -0.1666727923170661, holdDays: 3 },
    { entryFillDate: "2022-11-18", entryFillPrice: 16692.56, exitFillDate: "2022-12-09", exitFillPrice: 17224.1, exitReason: "max_hold", netTradeReturn: 0.02362107281919612, holdDays: 21 },
    { entryFillDate: "2026-02-09", entryFillPrice: 70330.38, exitFillDate: "2026-03-02", exitFillPrice: 65776.48, exitReason: "max_hold", netTradeReturn: -0.07220230259648908, holdDays: 21 },
  ],
  disclaimer:
    "Historical research simulation on Binance BTCUSDT daily bars. Not a Hunter live signal, not whale identity, not buy/sell intent, not deployed alpha.",
} as const;
