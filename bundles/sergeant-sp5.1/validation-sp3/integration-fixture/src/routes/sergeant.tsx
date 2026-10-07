import { SergeantAdvisor } from "@/components/btd/SergeantAdvisor";
import { SergeantRiskBrief } from "@/components/btd/SergeantRiskBrief";
import { assessSergeantRisk, sergeantRiskCeilingBlocksIncrease } from "@/lib/sergeant-risk";
import { buildSergeantDeskContext } from "@/lib/sergeant-chat/desk_context";
function X(){
  const currentPosition:any=null; const appliedSleeve=0; const riskBrief:any={}; const book:any={}; const marked:any={metrics:{}}; const kills:any={}; const selected:any=null; const flag:any=null;
  const riskCeilingBlocked = sergeantRiskCeilingBlocksIncrease(
    currentPosition?.targetSleeve ?? 0,
    appliedSleeve,
    riskBrief,
  );
  const deskContext = useMemo(
    () => buildSergeantDeskContext({
      book,
      metrics: marked.metrics,
      kills,
      risk: riskBrief,
      selected: selected && flag
        ? {
            symbol: selected.symbol,
            btdScore: selected.btdScore,
            confidence: selected.confidence,
            flag,
            currentSleevePct: (currentPosition?.targetSleeve ?? 0) * 100,
            requestedSleevePct: appliedSleeve * 100,
          }
        : null,
    }),
    [
      appliedSleeve, book, currentPosition?.targetSleeve, flag, kills, marked.metrics, riskBrief,
      selected?.btdScore, selected?.confidence, selected?.symbol,
    ],
  );
  return (
    <div>
        <SergeantAdvisor deskContext={deskContext} />
        <SergeantRiskBrief brief={riskBrief}/>{riskCeilingBlocked}
    </div>
  );
}
