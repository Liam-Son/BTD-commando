export const AOA_WONYOTTI_LORE = {
  id: "aoa_wonyotti_lore_v2",
  title: "AOA / 워뇨띠 research lore",
  status: "LORE · NOT A LIVE SIGNAL",
  sourceUrl: "https://evrdh.tistory.com/entry/how-to-aoa-trading",
  sourceLabel: "evrdh · how-to-aoa-trading",
  packNote: "Wallet totals verified from local aoa_public_2021-12-31 pack (fills not hosted).",
  window: { from: "2018-03", to: "2021-12" },
  venue: "BitMEX account label aoa — public wallet + execution dump",
  headline:
    "Named-trader archive: wallet-verified BitMEX aoa history. Not BTD alpha, not Hunter scan input, not a bot recipe.",
  metrics: [
    { label: "Deposit (wallet verified)", value: "14.49 BTC" },
    { label: "Realised PnL (wallet verified)", value: "+3,537.32 BTC" },
    { label: "Withdrawals (wallet verified)", value: "-2,832.53 BTC" },
    { label: "Peak / end balance", value: "~1,531 / ~737 BTC" },
    { label: "All-symbol trade fills", value: "1,439,207" },
    { label: "XBTUSD fills", value: "941,007" },
  ],
  rebuild: {
    label: "BTD offline XBTUSD RT rebuild (fees ignored, flip closes prior)",
    closedRts: "2,404",
    winRate: "70.9%",
    blogRts: "2,589",
    blogWinRate: "75.7%",
    note: "Count/WR gaps are definition + fee effects. Wallet PnL is the hard check — not the inverse proxy.",
  },
  principles: [
    {
      n: 1,
      title: "Box edges, fade the extreme",
      body: "Third-party frame: edge clustered at favorable ends of a short range box; mid-box high WR but weak cumulative. Large size favored counter-trend. Do not port to thin alts.",
    },
    {
      n: 2,
      title: "Leverage is the stop",
      body: "Scale-ins often worsened average; hard stops rare. Survival story is low effective leverage as the book grew — without that, averaging down is ruin.",
    },
    {
      n: 3,
      title: "Volatility = work; no direction ego",
      body: "Crash/chop months carried outsized work via long/short flips. Worst lore chapters: one-way stubbornness or idle stuck risk while fills went silent.",
    },
  ],
  failures: [
    "Thin alts (e.g. XRP squeeze) broke BTC-style fades.",
    "2021-05-19 one-way long into cascade (large single-day bleed in write-ups).",
    "2021-10 short left idle across a silent fill window.",
    "Author letter: no bots/leading rooms; if a bot printed, he would run it — do not buy dump-scrapers.",
  ],
  disclaimer:
    "Educational lore only. Wallet figures recomputed from the public aoa pack on disk. Round-trip stats are BTD offline definition (not broker statements). Fills are not shipped in this repo. Not investment advice, not copy-trading. Past is not future. Leveraged futures can wipe principal.",
} as const;
