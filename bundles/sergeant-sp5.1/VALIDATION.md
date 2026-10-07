# Sergeant SP4 validation — 2026-10-07

## Savepoint discipline

- Parent SP3 ZIP SHA256: `8048263a4609b44602a24b41166bdd9336da477fcd9ee6e4e785084040a67266`.
- GitHub production baseline was rechecked before SP4 work: `Liam-Son/BTD-commando` main is still `c0c0a9799770a4f33440193379c833608c351b61`.
- GitHub production was **not** modified. A fresh attempt to create `checkpoint/sergeant-sp4-rc` returned HTTP 403 (`Resource not accessible by integration`).
- SP0, SP1, SP2 and SP3 therefore remain independently recoverable.

## Exact-live-source compatibility

Using the GitHub connector against the current baseline, every SP2 and SP3 strict installer anchor was found exactly once, and none of the SP2/SP3 markers are already applied. See `LIVE_BASELINE_COMPATIBILITY.json`.

This means the saved integration scripts match the exact current GitHub source shape; it is stronger than validating only against a synthetic fixture.

## Regression findings fixed in SP4

1. **Single-name cap false global freeze** — risk v1 used `concentrationHeadroom` inside the global per-name ceiling. One existing name at its own 20% cap therefore made the global ceiling 0%. SP4 removes that double-counting. Single-name concentration remains in Book Health/posture and the frozen core max-sleeve rule remains authoritative.
2. **Max-names false global freeze** — `KillState.names` is true at the active-name limit, but the frozen core only blocks opening another name. SP1 used `kills.any`, which could incorrectly zero the overlay for changes to existing names. SP4 scopes hard global overlay blocking to feed DOWN, global halt, drawdown kill, or sleeve kill. Names-only becomes CAUTION.

Because these are semantic changes, the deterministic overlay id is bumped to `sergeant_risk_v2`. `btd_v1_0` and `sergeant_policy_v1` remain unchanged.

## Isolated strict TypeScript + runtime smoke

Validated with the local TypeScript compiler and Node using the same strict options used in previous savepoints:

- `sergeant-risk.ts` compiles.
- `sergeant-risk.test.ts` compiles.
- `desk_context.ts` compiles.
- `desk_context.test.ts` compiles.
- clean book => `CLEAR`, ceiling 20%.
- existing name exactly at 20% cap => `CAUTION`, ceiling remains 20% (no global freeze).
- feed DOWN => `NO INCREASE`, ceiling 0%.
- max-names only => `CAUTION`, ceiling remains 20%.
- reduction escape hatch remains true.
- stale `sergeant_risk_v1` chat context is rejected.
- tampered chat risk ceiling is bounded to 20%.

See `validation-sp4/typecheck.txt` and `validation-sp4/smoke.json`.

## Static integration guard

`integration/verify_sergeant_sp4.py` passed against an SP3-wired fixture and checks:

- v2 risk semantics present;
- route Risk Brief + ceiling guard + desk context present;
- API context sanitization present;
- Corporal safety refusals occur before deterministic desk-context answers;
- advanced Sergeant receives paper-only/no-broker/no-mutation constraints;
- no obvious live-broker execution marker was introduced in affected Sergeant files.

## Full-repository qualification status

**Not claimed yet.** This environment still cannot DNS-resolve `github.com` for `git clone`, and the connected GitHub integration is read-only for this repository. Therefore the complete repository `npm test`, production `npm run build`, browser rendering, and deployment were not executed here.

To close that gap, `integration/apply_sergeant_sp4.py` is a strict one-shot qualifier for a real clean checkout. It pins the exact baseline commit, refuses a dirty tree, applies SP1–SP4, runs the static verifier, runs `npm test` and `npm run build`, and rolls source back on failure. It never commits, pushes, deploys, or touches broker configuration.
