# BTD Commando — Ops Doctrine v0.1

**Platform:** BTD Commando  
**Eyes:** Sniper (indicator)  
**Voice of command (paper):** Sergeant / SGT (robo)  
**Authority for live capital:** You only  

---

## 1. Mission

Build **one military-discipline investment command glass** that combines:

1. **Own indicator** — Sniper reads dip attractiveness (`btd_v1_0`)  
2. **Robo-advisor** — Sergeant turns intel into **paper** posture and checklists  

Not a casino skin. Not “AI beats the market.”  
Inspired by real commando NCO standards: clear ROE, no freelancing past the wire without orders.

---

## 2. Roles

| Callsign | System | Does | Does not |
|----------|--------|------|----------|
| **Sniper** | Score engine + chart/TV/web readout | Publish 0–100 BTD, factors, ACQUIRE/STAND DOWN | Place orders |
| **Sergeant** | Policy layer | Size paper exposure, log “orders,” enforce kill-switches | Override user live promotion; hide risk |
| **Commando** | Platform shell | One HUD, one brand, shared disclaimer | Duplicate formulas |

---

## 3. ROE (rules of engagement)

1. **Score ≠ order.** ACQUIRE is intel, not a market order.  
2. **One formula.** `btd_v1_0` until a new version id ships on TS + Python (+ Pine proxy).  
3. **Paper first.** Sergeant runs paper/sim only until explicit L4+ OK.  
4. **BH honesty.** Total-return vs buy-and-hold may favor BH; disclose, don’t retune OS to fake a win.  
5. **No stolen-valor cosplay.** Discipline and craft; service background is personal pride — public copy stays professional unless you opt in to a short “built by a former ROK commando sergeant” line.  
6. **Degraded data visible.** Never silent fail on feeds.

---

## 4. Sergeant paper policy (v0 default — tunable later)

```text
INPUT:  Sniper BTD score S in [0,100], confidence optional
CORE:   stay mostly invested only if user enables "core sleeve"; default for pure indicator mode = no auto core
v0 SIMPLE (indicator-led paper log):
  if S >= 65 → FLAG "ACQUIRE" · suggested paper risk sleeve = high (e.g. 1.0 of unit book)
  if 50 <= S < 65 → FLAG "WATCH" · sleeve = mid (e.g. 0.5)
  if S < 50 → FLAG "REDUCE" · sleeve = low (e.g. 0.25)
  if S <= 35 → FLAG "STAND DOWN" · sleeve = 0.0–0.25
KILL:   max DD vs book, max positions, no live broker without L4
LOG:    timestamp, symbol, S, flag, suggested sleeve, user override
```

(Exact % can be UI inputs; freeze defaults in code when implemented.)

---

## 5. Build sequence (get it on)

| Phase | Deliverable |
|-------|-------------|
| **P0** | Doctrine + naming on GitHub (this file → `docs/`) |
| **P1** | Commando shell copy on web (header: BTD COMMANDO · Sniper / Sergeant tabs) |
| **P2** | Sniper = existing live rankings (already BTD) under Commando chrome |
| **P3** | Sergeant paper panel: score → flag → suggested sleeve + trade log (mock) |
| **P4** | Mil theme pass (hard HUD language) without breaking readability |
| **P5** | TV Sniper free publish (open/protected) — already drafted |
| **P6** | Python rigor runs stay private under `quant` |

---

## 6. Surfaces

| Surface | Name |
|---------|------|
| Web | **BTD Commando** |
| TV indicator | **BTD Sniper** |
| Paper RA module | **Sergeant** |
| Score id | **btd_v1_0** |

Live app today: https://dip-finder-score.lovable.app/  
Repo: https://github.com/Liam-Son/BTD-index  

---

## 7. Public one-liner (optional)

> **BTD Commando** — Sniper scores the dip; Sergeant runs paper discipline. Research tools, not financial advice.

Service line (only if you want it public later):

> Built with NCO standards — former ROK commando sergeant.

---

*Doctrine v0.1 · 2026-09-30*
