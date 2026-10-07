# Sergeant SP5 — deployment gate checkpoint

Status: **SOURCE-QUALIFIED / NOT DEPLOYED**

Pinned production baseline:

`c0c0a9799770a4f33440193379c833608c351b61`

SP5 preserves SP0–SP4 and adds a final deployment gate. It does not claim that the production repository or live site has been changed.

## What was re-verified in SP5

- Current GitHub `main` is still the pinned baseline commit above.
- The exact SP2 + SP3 wiring transformations were replayed in-memory against the current GitHub baseline and every strict anchor matched once.
- All expected route/advisor/API/Corporal/router markers were present after the shadow integration.
- SP4 TypeScript validation compiled again under strict settings.
- SP4 deterministic smoke suite passed again.
- A new 5,000-case randomized invariant suite passed.
- `sergeant_risk_v2` remains bounded to a maximum 20% safety-overlay per-name ceiling.
- Hard drawdown/sleeve/global-halt states and feed DOWN still prevent increases.
- Max-names remains scoped: it blocks another new name, not every existing-name change.
- Reductions remain available even when the risk ceiling is zero.
- Stale `sergeant_risk_v1` desk context is rejected.
- No broker or live-order capability is introduced by the SP1–SP4 changes.

## Why SP5 cannot be marked DEPLOYED here

The active GitHub App installation available to this chat is attached to a different GitHub installation account than `Liam-Son`. Reads of the public repository work, but repository write operations (branch creation, issues, collaborator permission reads) return GitHub `403 Resource not accessible by integration`.

This environment also cannot resolve `github.com` from the command runtime, so a clean repository clone and dependency install cannot be performed locally here. Therefore the complete repository `npm test` + `npm run build` gate must run in a clean real checkout before merge/deployment.

The supplied `integration/qualify_sergeant_sp5.py` performs that gate and refuses source drift.

## Frozen invariants

SP5 does not change:

- `btd_v1_0`
- `sergeant_policy_v1`
- normalized paper ledger semantics
- reduction escape hatch
- paper-only status
- no-broker / no-live-order boundary

Do not call SP5 production until `SP5_QUALIFICATION_REPORT.json` says `qualified: true` from a clean checkout and the live `/sergeant` acceptance checklist passes.
