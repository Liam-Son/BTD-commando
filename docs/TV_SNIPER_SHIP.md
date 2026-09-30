# TV Sniper ship pack

**TV = TradingView** (charting site + Pine Editor).  
**Sniper** = BTD Commando chart indicator (score pane).  
**Not** Sergeant (paper bot). **Not** the multi-asset web engine.

| | |
|--|--|
| **Formula** | `btd_v1_0` locked — 0.40V+0.25M+0.20F+0.10Q+0.05R |
| **SoT file** | `pine/BTD_Sniper.pine` |
| **Account** | `tjdcks7504` on TradingView (KR UI OK) |
| **Symbol for shot** | **AMEX:SPY** or **BATS:SPY** daily — not `NASDAQ:SPY` on KR |
| **Access** | Free **Open** or **Protected** only (no invite-only sell without Premium + new OK) |
| **GitHub ↔ TV** | **No auto-sync** — paste by hand |

## What this Pine is / isn’t

| Is | Isn’t |
|----|--------|
| Same **weights** as web `btd_v1_0` | Pixel clone of web multi-factor |
| Single-symbol **price proxies** for V/M/F/Q/R | Peer P/E pools, Fear & Greed API |
| ACQUIRE ≥65 / STAND DOWN ≤35 **flags** | Market orders / broker link |
| Research / education | Performance guarantee |

## Your upload steps (5 min)

1. Open https://www.tradingview.com/ or https://kr.tradingview.com/ · login `tjdcks7504`
2. Chart **AMEX:SPY** · **1D** · dark theme  
3. Pine Editor → new script → paste **entire** `pine/BTD_Sniper.pine` → **Save** as `BTD Commando Sniper`  
4. **Add to chart** · remove any old error panes  
5. Publish → **Public** → access **Open-source** *or* **Protected** (your pick)  
6. Paste description from section below  
7. Screenshot: score line + 65 / 50 / 35 lines only · no fake equity curve  

## Publish description (paste)

```
BTD Commando Sniper — Buy-the-Dip Score
======================================
Part of BTD Commando: Sniper scores the dip; Sergeant (separate) is paper discipline only.

Research question: "Is this a statistically attractive time to buy the dip?"

Score: 0–100 · Version: btd_v1_0 (TradingView chart PROXY)

BTD = 0.40·V + 0.25·M + 0.20·F + 0.10·Q + 0.05·R

On TV (one symbol), factors are transparent price proxies:
  V  depth below N-bar high (drawdown / cheapness)
  M  RSI(14) oversold map
  F  ATR% stress vs recent history
  Q  structure vs long MA
  R  inverse realized volatility

Same weight scheme as the public BTD web terminal — NOT a full clone
(no peer valuation pools, no Fear & Greed on-chart).

Zones (defaults): ≥65 ACQUIRE · ≤35 STAND DOWN · flags only, not orders.

How to use
1. Liquid symbol; daily bars are the design reference.
2. Read score + factors; combine with your own risk rules.
3. Score ≠ order. Buy-and-hold can beat sparse dip timers on total return.

Links
• Web terminal: https://dip-finder-score.lovable.app/
• Repo / methodology: https://github.com/Liam-Son/BTD-index
• Doctrine: https://github.com/Liam-Son/BTD-index/blob/main/docs/COMMANDO_DOCTRINE.md
• This script SoT: https://github.com/Liam-Son/BTD-index/blob/main/pine/BTD_Sniper.pine

Disclaimer: Research / educational only. Not investment advice.
Past behavior ≠ future results. You own your decisions.
```

## Agent will not do without new OK

- Invite-only / paid publish  
- Fake win-rate art  
- Weight changes  
- Claiming live edge from IC studies  

## After you publish

Reply with the **script URL** (or say GO + open/protected and ask the agent to click publish while logged in).
