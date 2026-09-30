# Progress notes

Short log of research / product work on **BTD Index™**. Score lock remains **`btd_v1_0`**.

## 2026-09-30

### Product
- Methodology v1.0 published under `docs/METHODOLOGY_v1.md`.
- README clarified: BTD is a **dip attractiveness score** (0–100), not investment advice.
- In-app “growth of 100” rule (≥65 / ≤35) stays **illustrative**, not a promoted edge.
- TradingView **Sniper** HUD is a **separate** Pine surface (chart-proxy of the same weights). Not wired to Lovable sync.
- Optional hard-mil **HUD preview** is cosmetic mock only (not live terminal chrome yet).

### Research rigor
- Adopted a freeze / IS–OS / promotion protocol so “verified” means more than a dashboard screenshot.
- **Anchor:** formula and product question stay fixed; beating buy-and-hold is **not** the success criterion.

### IC studies (Yahoo chart-proxy · diagnostic only)
Chart-proxy scores (price-based stand-in for full multi-factor web engine). Not a claim of live alpha.

| Study | Universe | Primary | IS IC (21d) | OS IC (21d) | Note |
|-------|----------|---------|------------:|------------:|------|
| `btd_20260930_spy_ic21` | SPY | Spearman vs 21d fwd | +0.19 | +0.14 | Sign-consistent; mild positive |
| `btd_20260930_multi_ic21` | SPY, GLD, SLV, BTC-USD | same | (per asset) | (per asset) | No weight retune |

**Multi-asset 21d IC (OS):** SPY +0.14 · SLV +0.12 · GLD ~0 (sign flip) · BTC unstable (negative IS).  
Adding gold/silver/BTC to a **binary timer** did **not** beat buy-and-hold on illustrative rule tests; multi-asset remains useful for **ranking coverage**, not automatic alpha.

### Stance
- Ship path: transparent score + methodology (public score product).
- Paper/live sleeves need explicit promotion gates later.
- Buy-and-hold can outperform sparse dip timers on total return — expected and disclosed.

### Next (gentle)
- [ ] Optional mil theme pass on the live web UI (Lovable), without changing `btd_v1_0`.
- [ ] Keep Python parity path under private research in sync when weights ever change (new version id).
- [ ] Free TradingView publish of Sniper as score tool when ready (open/protected).

---

*Notes are descriptive. Past research ≠ future results. Not investment advice.*
