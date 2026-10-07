# SP3 integration order

SP3 assumes SP1 + SP2 are already present.

Copy these new files into the repository first:

- `src/lib/sergeant-chat/desk_context.ts`
- `src/lib/sergeant-chat/desk_context.test.ts`

Then from the repository root run:

```bash
python integration/apply_sergeant_sp3.py .
```

The installer edits exactly five files:

- `src/routes/sergeant.tsx`
- `src/components/btd/SergeantAdvisor.tsx`
- `src/routes/api.sergeant-chat.ts`
- `src/lib/sergeant-chat/corporal_engine.ts`
- `src/lib/sergeant-chat/dual_rank_router_core.ts`

Before writing, every anchor is validated. If any target has drifted, the script aborts with **no changes**.
If validation succeeds, `.sp3.bak` rollback copies are created for all five files before any modified file is written.

SP3 does not edit `src/lib/sergeant.ts`, `src/lib/btd-core.ts`, score weights, policy bands, or any broker/execution code.
