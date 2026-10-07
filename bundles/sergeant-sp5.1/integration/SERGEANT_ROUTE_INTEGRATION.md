# SP2 `/sergeant` integration

Apply these changes to `src/routes/sergeant.tsx` after adding the SP1 risk engine and `SergeantRiskBrief.tsx`.

## 1. Imports

Add:

```ts
import { SergeantRiskBrief } from "@/components/btd/SergeantRiskBrief";
import { assessSergeantRisk, sergeantRiskCeilingBlocksIncrease } from "@/lib/sergeant-risk";
```

## 2. Compute the risk brief

Immediately after `feedState` is defined, add:

```ts
  const riskBrief = useMemo(
    () => assessSergeantRisk({
      book,
      metrics: marked.metrics,
      kills,
      feedState,
      inputReliability: selected?.confidence ?? null,
    }),
    [book, feedState, kills, marked.metrics, selected?.confidence],
  );
```

After `increasing` is defined, add:

```ts
  const riskCeilingBlocked = sergeantRiskCeilingBlocksIncrease(
    currentPosition?.targetSleeve ?? 0,
    appliedSleeve,
    riskBrief,
  );
```

Do not treat an already-existing position above the ceiling as a forced close. The guard only applies when `increasing === true`.

## 3. Export snapshot

After `exportCsv()`, add:

```ts
  function exportRiskBrief() {
    const snapshot = {
      createdAt: new Date().toISOString(),
      formulaId: BTD_FORMULA_ID,
      policyId: SERGEANT_POLICY_ID,
      selected: selected
        ? {
            symbol: selected.symbol,
            btdScore: selected.btdScore,
            confidence: selected.confidence,
          }
        : null,
      risk: riskBrief,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sergeant-risk-brief-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
```

## 4. Render Risk Brief

After the data-state warning and before the `Intel → paper intent` / `Kill switches` two-column section, add:

```tsx
        <SergeantRiskBrief
          brief={riskBrief}
          selectedSymbol={selected?.symbol ?? null}
          onExport={exportRiskBrief}
        />
```

## 5. Enforce the deterministic desk ceiling

Change the blocked-message condition from:

```tsx
(hardIncreaseBlocked || newNameBlocked || sleeveBlocked)
```

to:

```tsx
(hardIncreaseBlocked || newNameBlocked || sleeveBlocked || riskCeilingBlocked)
```

Use this message body:

```tsx
{riskCeilingBlocked
  ? `SP2 safety overlay caps new/increased per-name paper exposure at ${riskBrief.paperRiskCeilingPct.toFixed(1)}%. Reductions remain available.`
  : "This increase is blocked by an active kill/cap. Lower the paper sleeve or reduce exposure first."}
```

Add `riskCeilingBlocked` to the `disabled` expression on `Apply + log paper posture`.

## 6. Keep core policy untouched

Do **not** modify `flagFromScore`, `sleeveFromFlag`, `rebalancePaperPosition`, or the persisted book schema in SP2.
