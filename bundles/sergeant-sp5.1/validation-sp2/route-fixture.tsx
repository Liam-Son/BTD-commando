import { SergeantAdvisor } from "@/components/btd/SergeantAdvisor";
import { SergeantRiskBrief } from "@/components/btd/SergeantRiskBrief";
import { assessSergeantRisk, sergeantRiskCeilingBlocksIncrease } from "@/lib/sergeant-risk";
  const feedState: FeedState = error || (!isPending && assets.length === 0)
    ? "down"
    : data?.degraded.length
      ? "degraded"
      : isLive
        ? "live"
        : "snapshot";
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
  const appliedSleeve = Math.min(1, Math.max(0, overridePct / 100));
  const increasing = appliedSleeve > (currentPosition?.targetSleeve ?? 0) + 1e-9;
  const riskCeilingBlocked = sergeantRiskCeilingBlocksIncrease(
    currentPosition?.targetSleeve ?? 0,
    appliedSleeve,
    riskBrief,
  );
  function exportCsv() {
    const blob = new Blob([opsLogCsv(book.log)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sergeant-ops-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
        <SergeantRiskBrief
          brief={riskBrief}
          selectedSymbol={selected?.symbol ?? null}
          onExport={exportRiskBrief}
        />

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                {(hardIncreaseBlocked || newNameBlocked || sleeveBlocked || riskCeilingBlocked) && (
                  <p className="mt-3 text-[12px] text-down">
                    {riskCeilingBlocked
                      ? `SP2 safety overlay caps new/increased per-name paper exposure at ${riskBrief.paperRiskCeilingPct.toFixed(1)}%. Reductions remain available.`
                      : "This increase is blocked by an active kill/cap. Lower the paper sleeve or reduce exposure first."}
                  </p>
                )}
                  disabled={!hydrated || hardIncreaseBlocked || newNameBlocked || sleeveBlocked || riskCeilingBlocked || (Math.abs(appliedSleeve - suggestedSleeve) > 1e-9 && !reason.trim())}
