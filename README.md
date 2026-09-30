# BTD Index™

**Quantitative buy-the-dip terminal** — live multi-asset rankings with a transparent 0–100 score.

[Live app](https://dip-finder-score.lovable.app/) · Score version **`btd_v1_0`**

> Research signals only. **Not investment advice.** Past illustrative backtests ≠ future results.

---

## What it is

BTD answers one question: *is this a statistically attractive time to buy the dip?*  
Higher score → more evidence of fear, cheapness, and oversold conditions under the v1.0 factor model.

```
BTD = 0.40·Valuation + 0.25·Momentum + 0.20·Fear + 0.10·Quality + 0.05·Risk
```

| Factor | Weight | Role |
|--------|--------|------|
| Valuation | 40% | Peer P/E & P/B (or shrunk drawdown proxy) |
| Momentum | 25% | RSI(14) oversold map |
| Fear | 20% | Fear & Greed / VIX |
| Quality | 10% | ROE & debt/equity (or proxy) |
| Risk | 5% | Beta / vol |

Full write-up: [`docs/METHODOLOGY_v1.md`](docs/METHODOLOGY_v1.md)  
Recent notes: [`docs/PROGRESS.md`](docs/PROGRESS.md)

Core implementation: [`src/lib/btd-core.ts`](src/lib/btd-core.ts)

---

## Live product

- Global rankings table (stocks, crypto, ETFs, commodities, indices)
- Factor breakdown per name + confidence
- ~5 minute refresh cycle with live price overlay
- Illustrative “growth of 100” rule: enter ≥65 / exit ≤35 (product default — not a promoted research edge)

Data: Yahoo Finance, CoinGecko, alternative.me (coverage may be partial; UI should show degraded feeds).

---

## Stack

- TanStack Start / Vite / TypeScript
- Lovable-synced UI (`lovable-dev[bot]` commits)
- Optional Supabase under `supabase/`

```bash
git clone https://github.com/Liam-Son/BTD-index.git
cd BTD-index
npm i   # or bun
npm run dev
```

---

## Research track

Python parity and diagnostics live under private research (`quant/strategies/btd/`), version-locked to **`btd_v1_0`**.

- **Product job:** dip score / ranking — not “beat buy-and-hold.”
- **Rigor:** freeze formula · time-based IS/OS · document metrics before any weight change (new version id).
- **Chart-proxy IC** (Yahoo, diagnostic): mild positive 21d rank IC on SPY/SLV in a 2026-09-30 study; GLD/BTC less stable. See `docs/PROGRESS.md`.
- Do not change app weights without bumping the version string on **both** TypeScript and Python.

TradingView Sniper (if published) is a **separate** Pine surface using a price proxy of the same weights — not the Lovable app binary.

---

## Disclaimer

BTD Index™ scores are quantitative research tools. They do not constitute financial, investment, or trading advice. You are solely responsible for any decisions you make.
