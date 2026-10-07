# Sergeant SP3 — Desk-aware chat context

Baseline: SP2 deterministic risk overlay and Risk Brief/Stress Lab.

## Goal

Make Corporal/Sergeant understand the current local **paper** desk without giving chat authority to mutate portfolio state.

## New context contract

`sergeant_desk_context_v1` contains a compact, versioned client-reported paper snapshot:

- frozen formula/policy ids
- selected Sniper symbol, BTD score, input reliability and paper posture
- current/typed paper sleeve percentages
- book equity, drawdown, gross exposure, names, concentration and P/L
- active kill state
- SP2 deterministic risk posture, book health and paper-risk ceiling
- SP2 stress scenarios

The API sanitizes the snapshot before Corporal or optional advanced Sergeant sees it.

## Deterministic Corporal abilities

With a valid desk context, Corporal can answer:

- “How is my paper book?”
- “Why is the posture CAUTION?”
- “What is my paper-risk ceiling?”
- “Can I increase this paper position?”
- “What happens in a -20% stress scenario?”
- “Are any kills tripped?”
- “What symbol is selected?”

These answers describe the current local paper desk. They do **not** change it.

## Trust boundary

The snapshot originates in the browser and is therefore labeled `client_reported_paper_snapshot`.
It is useful for explanation, not authoritative broker/account state. No broker data, credentials, or live-order permissions are introduced.

## Optional advanced model

If the private Sergeant backend is configured, the sanitized context may be included in the request body with explicit paper-only/no-mutation constraints. The deterministic policy/risk engine remains authoritative for the website desk. The model cannot loosen kills, alter `btd_v1_0`, or mutate the local paper book through chat.

## Invariants

- paper only
- no broker path
- no chat portfolio mutation
- no fake execution claims
- no personalized live-order recommendation
- deterministic safety logic remains outside the LLM
- invalid/tampered context is discarded or bounded before use
