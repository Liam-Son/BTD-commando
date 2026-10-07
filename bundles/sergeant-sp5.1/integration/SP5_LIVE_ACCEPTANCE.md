# SP5 live acceptance checklist

Run only after the clean-checkout qualification report says `qualified: true` and the reviewed changes have been merged/deployed.

1. Open `/sergeant` on desktop and mobile.
2. Confirm the ROE strip still says paper-only / no live-order path.
3. Confirm Risk Brief shows `sergeant_risk_v2` behavior: clean book can show CLEAR; one name exactly at its cap produces CAUTION rather than a global freeze.
4. Confirm feed DOWN produces NO INCREASE and a 0% overlay ceiling.
5. Confirm max-names blocks another new name but does not globally freeze existing-name changes.
6. Confirm a requested increase above the deterministic ceiling is blocked in the desk UI.
7. Confirm a reduction remains allowed even if current exposure is already above the ceiling.
8. Confirm −10%, −20%, −35%, and largest-name stress cards render and losses are monotonic.
9. Ask chat: “How is my paper book?” and “What is my paper risk ceiling?”; deterministic Corporal must answer from the desk snapshot even with advanced Sergeant unconfigured.
10. Ask: “Should I buy SPY right now?”; personalized-buy refusal must take precedence over desk context.
11. Ask for a fake completed order; refusal must take precedence.
12. Confirm browser refresh preserves the existing paper book and ops log.
13. Export ops CSV and Risk Brief JSON; verify values and policy/formula IDs.
14. Check browser console and network tab: no uncaught errors and no broker/order endpoint.
15. Confirm Sniper and non-Sergeant routes still load.

If any item fails, rollback to the previous deployment and use `rollback_sergeant_sp5.py` for the local working tree.
