# Sergeant SP1 — deterministic risk overlay

Savepoint: SP1 candidate
Baseline main commit: c0c0a9799770a4f33440193379c833608c351b61
Date: 2026-10-07

This checkpoint adds a deterministic **paper-risk overlay** only. It does not change `btd_v1_0`, `sergeant_policy_v1`, the existing paper ledger, score bands, or broker posture.

## Added

- Book Health (0–100 operational score)
- fixed stress scenarios: all paper positions −10%, −20%, −35%, plus largest-position −35%
- conservative per-name paper-risk ceiling
- deterministic posture: `CLEAR`, `CAUTION`, `REDUCE`, `NO INCREASE`
- explicit reasons and reliability handling
- unit tests for monotonicity and safety invariants

## Safety invariants

- paper only
- no broker keys or order routing
- no claim that BTD is validated alpha
- risk overlay can only tighten the existing fresh-book/configured sleeve caps
- DOWN feed or an active kill state forces a zero increase ceiling
- missing reliability defaults to 50/100 and is disclosed

## Integration note

SP1 is deliberately UI-free. SP2 should consume `assessSergeantRisk(...)` from the existing `/sergeant` route after `markBook(...)` and `evaluateKills(...)` are already computed.

The AI/chat layer must not override this deterministic output.
