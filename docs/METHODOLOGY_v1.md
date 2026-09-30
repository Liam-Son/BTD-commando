# BTD Index™ Methodology v1.0 (`btd_v1_0`)

**Status:** production score definition for the public terminal + research baseline  
**Not investment advice.** Scores quantify *relative dip attractiveness*; they do not guarantee returns.

## One-line definition

**BTD** is a 0–100 composite:

\[
\mathrm{BTD} = 0.40\,V + 0.25\,M + 0.20\,F + 0.10\,Q + 0.05\,R
\]

| Factor | Weight | Idea | Main inputs |
|--------|--------|------|-------------|
| **V** Valuation | 40% | Cheaper vs peers → higher | P/E, P/B peer percentiles (invert). No fundamentals → drawdown proxy, **shrunk 55% toward 50** |
| **M** Momentum | 25% | Oversold → higher | RSI(14): \(M=\mathrm{clamp}(((70-\mathrm{RSI})/50)\times100)\) |
| **F** Fear | 20% | Market fear → higher | Fear & Greed as \(100-\mathrm{FG}\); else VIX mapped 12→38 |
| **Q** Quality | 10% | Stronger BS → higher | ROE, debt/equity; else shrunk proxy |
| **R** Risk | 5% | Lower beta/vol → higher | Beta; else ann. vol / 20 as pseudo-beta |

**Proxy shrink:** `value = 50 + (raw - 50) * 0.55` when a factor is not measured from real fundamentals.

**Confidence:** starts from 100, minus factor dispersion (stdev of component scores) and `proxy_weight * 45`.

## Ratings (display)

| Score | Label |
|------:|-------|
| 95–100 | Extreme Opportunity |
| 90–94 | Exceptional Buy |
| 80–89 | Strong Buy |
| 70–79 | Buy |
| 60–69 | Watch |
| 50–59 | Neutral |
| 40–49 | Weak |
| 0–39 | Avoid |

## Live terminal behavior

- Full snapshot rebuild on a cycle (≈5 minutes) with Yahoo / CoinGecko / alternative.me where available.
- Intraday **price overlay** can recompute price-sensitive V and M; F/Q/R carried from snapshot.
- Degraded feeds (e.g. crypto) must surface as partial coverage — never silent.

## Illustrative product rule (UI backtest)

- Enter when score crosses **≥ 65**, exit **≤ 35**, weekly rebalance flavor as implemented in app.
- Historical chart may use a **time-series subset** of factors when point-in-time fundamentals are unavailable — this is **not** identical to the live multi-factor score. Label it as such (already on site).

## Research defaults (Project 2)

| Knob | Value |
|------|--------|
| Universe | Multi-asset liquid ~40 (aligned with live board) |
| Primary horizon | **21 trading days** |
| Secondary | 5d, 63d |
| Costs | **10 bps** equity/ETF RT · **20 bps** crypto RT |
| Execution | Signal on close → trade **next open** |
| Promotion | Paper only until parity tests + pre-registered OS + explicit acceptance |

## Versioning

- **`btd_v1_0`:** freeze of `src/lib/btd-core.ts` as of this methodology.
- Any weight or formula change → **`btd_v1_1+`** on **both** TypeScript and Python.

## Implementation pointers

- TypeScript: `Liam-Son/BTD-index` → `src/lib/btd-core.ts`
- Python parity: session artifact `btd_score_v1.py` → install under `quant/strategies/btd/score_v1.py`
- Live app: https://dip-finder-score.lovable.app/
