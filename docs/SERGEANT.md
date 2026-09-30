# Sergeant / SGT — paper discipline layer

Status: research / paper tooling only. No live broker or real-money order path.

Sergeant consumes Sniper BTD scores from `btd_v1_0` and turns them into paper posture, a normalized paper book, kill-switch enforcement, override logging, and a persistent browser-local ops log. It does not calculate or fork BTD factor weights.

## Frozen ids

- Score formula: `btd_v1_0` — unchanged
- Paper policy: `sergeant_policy_v1`
- Storage schema: `2`
- Storage key: `btd.sergeant.v2`
- Legacy import key: `btd.sergeant.v1`

Changing BTD weights requires a new BTD formula id. Sergeant v1 is a policy/discipline bump only; the score bands and suggested sleeves remain unchanged from v0.

## Frozen score bands and suggested paper sleeves

| Sniper BTD | Flag | Suggested paper sleeve |
|---|---|---:|
| `>= 65` | ACQUIRE | 100% |
| `50–<65` | WATCH | 50% |
| `>35–<50` | REDUCE | 25% |
| `<= 35` | STAND DOWN | 10% |

These are paper suggestions, not market orders. Sergeant verifies that the passed flag and suggested sleeve match the frozen score bands before accepting a paper intent.

## Shipping kill defaults

- Max book drawdown: 10%
- Max active names: 10
- Max single-name sleeve: 100%
- Global halt: off
- Normalized starting paper NAV: 100 units
- Gross target: <= 100%; no implicit leverage

Global halt and max-drawdown kills block new/increased paper exposure but permit reductions/closures. Max-names blocks a new name when the book is already at the limit. Max-sleeve monitors **actual marked single-name exposure**, so price drift can trip concentration even if the original target was lower.

A key v1 safety rule is the **reduction escape hatch**: tightening a sleeve cap or discovering an over-limit state never prevents a step-down. An increase can be blocked; a reduction can continue toward compliance.

## Feed discipline

Feed states are `live`, `snapshot`, `degraded`, and `down`.

- `live`: normal paper operations.
- `snapshot`: visible non-live state; paper actions remain explicitly labeled.
- `degraded`: missing/degraded inputs remain visible and are recorded in the ops row.
- `down`: new/increased paper exposure is blocked. Reductions/closures remain available and are logged as DOWN-feed actions.

No feed failure silently becomes a live claim.

## Paper ledger

A paper posture applies a synthetic fill at the current Sniper reference price. Target notional is `applied sleeve × current normalized book equity`; units are `target notional / reference price`.

The ledger tracks:

- normalized cash
- paper positions and average price
- current marks
- target sleeves
- realized P/L on reductions/closures
- unrealized P/L
- book equity and peak equity
- drawdown
- actual gross exposure
- actual max single-name exposure

This remains a deliberately simple research ledger. It is not tax, FX, fee, slippage, borrow, corporate-action, or broker-grade accounting.

## Overrides

If applied sleeve differs from the policy suggestion, the operator must enter a reason. The log stores the score, flag, suggested/applied sleeve, synthetic price, unit delta, realized-P/L delta, equity-after, feed state, formula id, and policy id.

Sergeant also rejects a caller that supplies a flag or suggested sleeve inconsistent with the frozen policy mapping.

## Kill-control governance

Every accepted kill-setting change is logged as `KILL_CHANGE`.

Tightening controls may be applied without a typed reason; the log records `Risk controls tightened`. **Loosening** any risk control requires an explicit reason:

- raising max drawdown
- raising max names
- raising max sleeve
- releasing global halt

Global halt has a dedicated immediate `HALT NOW` control. Releasing it requires a reason.

## Persistence contract and migration

`localStorage["btd.sergeant.v2"]` stores schema v2:

- `schemaVersion`
- `formulaId`
- `policyId`
- `cash`
- `peakEquity`
- `realizedPnl`
- `positions[]`
- `log[]` (newest first, max 500)
- `kills`
- `updatedAt`

The loader validates/sanitizes numeric values, timestamps, positions, log rows, kill settings, duplicate symbols, and the formula id. Corrupt/incompatible state is reset visibly rather than trusted silently.

If v2 is absent but `btd.sergeant.v1` exists, Sergeant imports the valid v1 book into schema v2. Because v1 did not persist realized P/L, migrated realized P/L starts at 0 and the UI shows a migration warning. The old key is left untouched for rollback/recovery.

If localStorage read/write fails, the UI visibly reports degraded persistence. It does not claim that the book is safely persisted.

## Always-on ROE

The Sergeant route always renders:

`score ≠ order · paper only · btd_v1_0 · sergeant_policy_v1 · not investment advice · no live-order path`

## Manual acceptance checklist

1. Open `/sergeant`; verify the ROE strip is always rendered.
2. Healthy feed: verify a valid score maps to the frozen flag/sleeve table.
3. Policy lock: try passing a mismatched flag/suggestion in unit tests; verify rejection.
4. Persistence: apply a paper posture, refresh, and verify position, kills and log survive.
5. Migration: seed `btd.sergeant.v1`, remove v2, refresh, and verify v2 migration warning plus preserved positions.
6. Storage failure: block/quota localStorage and verify persistence is visibly degraded.
7. Override: change applied sleeve from suggestion with blank reason; verify rejection. Add reason; verify acceptance and log.
8. Global halt: press `HALT NOW`; verify exposure increases are blocked while reductions still work.
9. Halt release: attempt release without reason; verify rejection. Add reason; verify logged release.
10. Drawdown kill: mark the paper book past max DD; verify new/increased exposure is blocked.
11. Max names: hit the configured name limit and verify another new name is rejected.
12. Max sleeve: tighten the cap below an existing position; verify the kill trips and a step-down reduction remains possible.
13. Price-drift concentration: raise a mark enough to exceed max sleeve; verify actual exposure trips the kill.
14. Feed DOWN: with stale/failed feed, verify increases are blocked but reductions remain available and are logged as DOWN.
15. Empty feed: verify an explicit empty/down state appears instead of an endless loading skeleton.
16. Realized P/L: open, change price, reduce/close, and verify realized P/L persists after the position disappears.
17. CSV: export and verify both paper rows and `KILL_CHANGE` rows are present.
18. Regression: open Sniper `/` and verify its board and `CommandoHeader` are unchanged.
19. Code search: verify no broker SDK, API key, order-submit endpoint, or live execution function exists in the Sergeant patch.

## What is not live

There is no broker integration, API-key handling, order routing, live capital sizing, or background execution. `ACQUIRE` remains intel/paper posture. Only a separately authorized future L4+ build may introduce live-capital behavior.

## Open risks

- Browser-local storage can be cleared and does not provide server-side audit durability.
- Snapshot/degraded feeds can be stale; the UI labels them rather than claiming live parity.
- The book is long-only and normalized; no borrowing, shorting, fees, slippage, taxes, FX, or corporate actions are modeled.
- The 100% ACQUIRE suggestion can consume the normalized book by itself. Multiple names therefore require lower applied sleeves/overrides under the current frozen policy; this patch does **not** reinterpret or silently rescale the frozen v0 sleeve percentages.
- A future change to the score bands, sleeve semantics, or shipped risk defaults requires another explicit policy version bump.
