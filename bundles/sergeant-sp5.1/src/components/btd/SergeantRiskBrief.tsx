import type { SergeantRiskBrief as RiskBrief } from "@/lib/sergeant-risk";

function postureTone(posture: RiskBrief["posture"]): string {
  if (posture === "CLEAR") return "border-up/40 bg-up/10 text-up";
  if (posture === "CAUTION") return "border-warn/40 bg-warn/10 text-warn";
  return "border-down/40 bg-down/10 text-down";
}

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

export function SergeantRiskBrief({
  brief,
  selectedSymbol,
  onExport,
}: {
  brief: RiskBrief;
  selectedSymbol?: string | null;
  onExport?: () => void;
}) {
  return (
    <section className="rounded border border-border bg-surface p-5" aria-label="Sergeant deterministic risk brief">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Sergeant risk brief · deterministic overlay
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight">Book health & stress</h3>
            <span className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${postureTone(brief.posture)}`}>
              {brief.posture}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-muted-foreground">
            Safety overlay only. It does not change the BTD score or frozen Sergeant policy. The per-name ceiling tightens for drawdown, feed quality, or input reliability; concentration remains visible in book health/posture and is hard-enforced by the existing sleeve cap.
          </p>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">
          <div className="font-mono text-foreground">{brief.engineId}</div>
          <div>Feed {brief.feedState.toUpperCase()}</div>
          {selectedSymbol ? <div>Focus {selectedSymbol}</div> : null}
          {onExport ? (
            <button
              type="button"
              onClick={onExport}
              className="mt-2 border border-border bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground hover:border-primary/50"
            >
              Export brief
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Book health</p>
          <p className="mt-1 font-mono text-2xl font-bold">{brief.bookHealth.toFixed(1)}<span className="text-xs text-muted-foreground"> / 100</span></p>
        </div>
        <div className="rounded border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Paper risk ceiling</p>
          <p className="mt-1 font-mono text-2xl font-bold">{pct(brief.paperRiskCeilingPct)}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Maximum new/increased per-name paper target under this overlay.</p>
        </div>
        <div className="rounded border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Input reliability</p>
          <p className="mt-1 font-mono text-2xl font-bold">{brief.inputReliability.toFixed(0)}<span className="text-xs text-muted-foreground"> / 100</span></p>
          {!brief.reliabilityKnown ? <p className="mt-1 text-[10px] text-warn">Unknown → conservative 50 used</p> : null}
        </div>
        <div className="rounded border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Feed quality</p>
          <p className="mt-1 font-mono text-2xl font-bold">{brief.components.feedQuality.toFixed(0)}<span className="text-xs text-muted-foreground"> / 100</span></p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Health components</p>
          <div className="mt-3 space-y-2 text-[12px]">
            {[
              ["Drawdown headroom", brief.components.drawdownHeadroom],
              ["Concentration headroom", brief.components.concentrationHeadroom],
              ["Gross discipline", brief.components.grossDiscipline],
              ["Feed quality", brief.components.feedQuality],
              ["Input reliability", brief.components.inputReliability],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono text-foreground">{Number(value).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Stress lab</p>
          {brief.stress.length === 0 ? (
            <p className="mt-3 text-[12px] text-muted-foreground">No active paper positions to stress.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="pb-2 pr-3">Scenario</th>
                    <th className="pb-2 pr-3 text-right">Book loss</th>
                    <th className="pb-2 text-right">Est. NAV</th>
                  </tr>
                </thead>
                <tbody>
                  {brief.stress.map((scenario) => (
                    <tr key={scenario.id} className="border-t border-border/70">
                      <td className="py-2 pr-3">{scenario.label}</td>
                      <td className="py-2 pr-3 text-right font-mono text-down">−{scenario.estimatedLossPct.toFixed(2)}%</td>
                      <td className="py-2 text-right font-mono">{scenario.estimatedEquity.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded border border-border bg-background p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Why this posture</p>
        <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
          {brief.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
        </ul>
      </div>
    </section>
  );
}
