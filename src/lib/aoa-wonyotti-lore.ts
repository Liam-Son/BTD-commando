export const AOA_WONYOTTI_LORE = {
  id: "aoa_wonyotti_lore_v1",
  title: "AOA / 워뇨띠 research lore",
  status: "LORE · NOT A LIVE SIGNAL",
  sourceUrl: "https://evrdh.tistory.com/entry/how-to-aoa-trading",
  sourceLabel: "evrdh · how-to-aoa-trading",
  window: { from: "2018-03", to: "2021-12" },
  venue: "BitMEX account label aoa (public fills analysis by third party)",
  headline: "Third-party reconstruction of public BitMEX aoa fills — not BTD alpha, not Hunter scan input.",
  metrics: [
    { label: "Deposit", value: "14.5 BTC" },
    { label: "Realized PnL", value: "+3,537 BTC" },
    { label: "Fills / round-trips", value: "~1.44M / 2,589" },
    { label: "XBTUSD win rate", value: "75.7%" },
    { label: "Avg win / loss", value: "+2.8 / −5.7 BTC" },
    { label: "Payoff (avg)", value: "~0.5×" },
  ],
  principles: [
    {
      n: 1,
      title: "Box edges, fade the extreme",
      body: "Most reported edge sat at the favorable end of a ~7-day range (long near lows, short near highs). Mid-box entries kept high win rate but poor cumulative PnL. Large size favored counter-trend vs chase.",
    },
    {
      n: 2,
      title: "Leverage is the stop",
      body: "Adds often worsened average price; hard stops were rare. Survival came from low effective leverage that fell as the book grew (~2× → ~1× on the analysis), so scale-ins could not liquidate the account.",
    },
    {
      n: 3,
      title: "Volatility = work; no direction ego",
      body: "Biggest months clustered in crash/chop vol. Best days flipped long/short with the wave. Worst days: one-way stubbornness or leaving a stuck position unattended while fills went silent.",
    },
  ],
  failures: [
    "Thin alts (e.g. XRP squeeze) broke BTC-style fades.",
    "2021-05-19 one-way long into cascade ~−172 BTC XBT day.",
    "2021-10 short left idle across a silent fill window, large bleed.",
  ],
  disclaimer:
    "Educational lore only. Numbers and interpretations come from a public third-party write-up of historical BitMEX aoa records — not verified by BTD, not investment advice, not copy-trading, not a bot recipe. Past fills ≠ future returns. Leveraged futures can wipe principal.",
} as const;
