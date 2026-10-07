# Sergeant SP5.1 — repo-ready bundle

Baseline expected: `c0c0a9799770a4f33440193379c833608c351b61`

This bundle contains the full SP1→SP5 work plus two SP5.1 corrections found during the final test pass:

1. **Unknown input reliability ⇒ CAUTION**
   - Missing reliability still uses conservative neutral 50/100 for sizing.
   - The desk no longer labels that state `CLEAR`.

2. **Above-ceiling chat explanation**
   - If the selected paper sleeve is already at/above the current deterministic ceiling,
     Corporal explicitly says **no increase is permitted**.
   - Holding/reducing remains possible.
   - Chat remains non-mutating and paper-only.

Frozen invariants remain unchanged:
- `btd_v1_0`
- `sergeant_policy_v1`
- paper-only
- no broker keys
- no live-order path

## Apply to a clean local checkout

From this bundle:

```bash
python integration/qualify_sergeant_sp5_1.py /path/to/BTD-commando
```

The qualifier requires the pinned baseline and a clean worktree. It invokes the transactional
installer, runs the full repo `npm test`, `npm run build`, strict TypeScript, Sergeant invariant
verification, and `git diff --check`. It does **not** commit, push, merge, deploy, or touch broker
configuration.

If qualification fails, rollback is attempted automatically. Manual rollback:

```bash
python integration/rollback_sergeant_sp5_1.py /path/to/BTD-commando
```
