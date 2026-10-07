# Sergeant SP2 — Risk Brief + Stress Lab UI

Baseline remains `Liam-Son/BTD-commando` main at `c0c0a9799770a4f33440193379c833608c351b61` plus the SP1 deterministic risk module.

## Goal

Expose the SP1 deterministic risk engine on `/sergeant` without changing `btd_v1_0`, `sergeant_policy_v1`, existing paper accounting, or broker posture.

## UI additions

- Book Health 0–100
- deterministic posture: CLEAR / CAUTION / REDUCE / NO INCREASE
- paper-risk ceiling
- selected asset input reliability
- feed-quality score
- five health components
- stress scenarios for all paper positions and the largest paper position
- exportable JSON risk-brief snapshot

## Desk guardrail

When the operator is increasing a position, the applied paper sleeve must not exceed the SP1 paper-risk ceiling. Existing positions above the ceiling are **not force-sold**. Reductions remain available.

The ceiling is a safety overlay. It does not rewrite the frozen BTD score bands or suggested sleeves.

## Invariants

- paper only
- no broker API
- no real-order path
- no claim of validated alpha
- no automatic loosening of risk controls
- no forced liquidation from the UI
- risk overlay can only tighten new/increased paper exposure
