export const COOLISH_LORE = {
  id: "coolish_paul_wei_lore_v2",
  title: "Paul Wei / @coolish research lore",
  status: "LORE · NOT A LIVE SIGNAL",
  sourceUrl: "https://github.com/bwjoke/BTC-Trading-Since-2020",
  sourceLabel: "BTC-Trading-Since-2020 public archive",
  bitmexUrl: "https://www.bitmex.com/hall-of-legends",
  window: { from: "2020-05-01", to: "2026-07-23" },
  headline:
    "Public BitMEX ledger for Paul Wei (@coolish). Charts use the archive's own adjusted-wealth series. Not a Hunter signal.",
  metrics: [
    { label: "Orders", value: "43,258" },
    { label: "Trade-history rows", value: "173,577" },
    { label: "Baseline", value: "1.84 XBT" },
    { label: "Adjusted wealth", value: "99.46 XBT" },
    { label: "Archive multiple", value: "54.1x" },
    { label: "Withdrawals", value: "99.52 XBT" },
  ],
  curve: [
    { date: "2020-05", mult: 1 }, { date: "2020-09", mult: 3.82 }, { date: "2021-01", mult: 4.63 },
    { date: "2021-02", mult: 25.17 }, { date: "2021-04", mult: 30.22 }, { date: "2021-05", mult: 23.73 },
    { date: "2021-08", mult: 33.25 }, { date: "2021-10", mult: 39.5 }, { date: "2022-01", mult: 37.78 },
    { date: "2022-11", mult: 37.17 }, { date: "2023-11", mult: 42.77 }, { date: "2024-07", mult: 45.71 },
    { date: "2024-12", mult: 44.79 }, { date: "2025-04", mult: 50.36 }, { date: "2025-12", mult: 50.64 },
    { date: "2026-07", mult: 54.07 },
  ],
  years: [
    { y: "2020", v: 5.73 }, { y: "2021", v: 36.35 }, { y: "2022", v: 37.73 },
    { y: "2023", v: 43.37 }, { y: "2024", v: 44.98 }, { y: "2025", v: 50.74 }, { y: "2026", v: 54.07 },
  ],
  btcShare: [
    { label: "All", v: 84 },
    { label: "2022+", v: 93.8 },
    { label: "2023+", v: 96.1 },
    { label: "2024+", v: 99 },
  ],
  events: [
    { label: "Realised", v: 15137 },
    { label: "Funding", v: 2068 },
    { label: "Spot", v: 322 },
    { label: "Transfer", v: 53 },
    { label: "Withdraw", v: 9 },
  ],
  flows: [
    { label: "Deposits", v: 1.77 },
    { label: "Withdrawals", v: 99.52 },
  ],
  notes: [
    "BitMEX Hall of Legends cites 70x over 3 years. This chart is the archive's adjusted multiple, 54.1x, not that headline.",
    "Downsampled from 17,602 ledger rows. BTD did not rebuild the curve.",
  ],
  disclaimer:
    "Educational lore only. Not investment advice. Fills are not hosted here. Past results are not future returns.",
} as const;
