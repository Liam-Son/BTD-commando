# Sergeant SP4 — Release-candidate hardening

Baseline: SP3 desk-aware paper chat + SP2 deterministic risk overlay.

## Why SP4 exists

Regression review found one important semantic edge case in `sergeant_risk_v1`:
when one existing paper position reached its configured single-name cap, the concentration-headroom factor fell to zero and therefore collapsed the **global** per-name paper-risk ceiling to 0%. That could prevent adding an unrelated new paper name even when the book still had ample cash/gross capacity.


A second regression was found in the same review: `KillState.names` becomes true when the book reaches the maximum number of active names, but the frozen Sergeant core uses that state only to block **another new name**. SP1 had treated `kills.any` as a global increase freeze. SP4 now scopes the hard overlay freeze to global halt, drawdown, sleeve breach, or feed DOWN. A names-only limit produces CAUTION and leaves existing-name changes governed by the remaining controls.

That mixed two different controls:

- **single-name concentration**, already hard-enforced by Sergeant's `maxSleevePct`; and
- the **global deterministic safety overlay**, which should tighten per-name targets for poor reliability, drawdown or feed quality.

## SP4 fix

Risk engine id is bumped to `sergeant_risk_v2`.

The per-name paper-risk ceiling now uses the most restrictive of:

- input reliability
- drawdown headroom
- feed quality
- the existing 20% fresh-book ceiling / lower configured max sleeve

Current single-name concentration remains visible in Book Health and posture, and the core Sergeant max-sleeve and <=100% gross rules remain authoritative.

A name using >=90% of its cap now produces **CAUTION**, not an automatic REDUCE/global freeze. Exceeding the hard cap still trips the existing kill state and produces **NO INCREASE**.

## Trust-boundary hardening

The desk-context schema remains `sergeant_desk_context_v1`, but it now requires `sergeant_risk_v2`.

The API-side sanitizer also bounds `paperRiskCeilingPct` to 0–20 because this overlay is never allowed to expand beyond the fresh-book safety ceiling. Stale v1-risk snapshots are rejected rather than silently reinterpreted.

## Frozen invariants

SP4 does **not** change:

- `btd_v1_0`
- `sergeant_policy_v1`
- the paper ledger
- existing kill-switch semantics
- the reduction escape hatch
- paper-only status
- no-broker / no-live-order boundary

## Qualification target

A complete repository qualification requires, from a clean checkout of the pinned baseline:

1. apply SP4 with the supplied installer;
2. run all Vitest tests;
3. run the production build;
4. run the static SP4 invariant verifier;
5. manually inspect `/sergeant` desktop + mobile;
6. commit only after all checks pass.
