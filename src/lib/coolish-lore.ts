export const COOLISH_LORE = {
  id: "coolish_paul_wei_lore_v1",
  title: "Paul Wei / @coolish research lore",
  status: "LORE · NOT A LIVE SIGNAL",
  sourceUrl: "https://github.com/bwjoke/BTC-Trading-Since-2020",
  sourceLabel: "BTC-Trading-Since-2020 public archive",
  bitmexUrl: "https://www.bitmex.com/hall-of-legends",
  window: { from: "2020-05-01", to: "2026-07-23" },
  headline:
    "Public BitMEX ledger for Paul Wei (@coolish). Discretionary BTC trading archive, not a Hunter signal and not a bot recipe.",
  metrics: [
    { label: "Orders", value: "43,258" },
    { label: "Trade-history rows", value: "173,577" },
    { label: "Deposits", value: "1.77 XBT" },
    { label: "Withdrawals", value: "99.52 XBT" },
    { label: "Adjusted wealth", value: "99.46 XBT" },
    { label: "Archive multiple", value: "54.1x" },
  ],
  notes: [
    "BitMEX Hall of Legends cites a 70x Bitcoin-trading return over 3 years. The archive's own adjusted wealth figure is 54.1x versus a 1.84 XBT baseline. Those are not the same number.",
    "About 84% of executed notional is BTC-related. From 2024 it is about 99%. This is a manual BTC book, not an HFT tape.",
    "Snapshot cutoff 2026-07-23. The publisher says it is a final archive, not a live feed.",
  ],
  disclaimer:
    "Educational lore only. Numbers come from the public GitHub archive and BitMEX's Hall of Legends page. BTD did not recompute the equity curve. Fills are not hosted here. Not investment advice. Past results are not future returns.",
} as const;
