import { KWHALE_REJECTED } from "@/lib/kwhale-rejected";

const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
const money = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** Historical rejected research log only. Not a live Hunter signal. */
export function KWhaleRejectedLog() {
  const m = KWHALE_REJECTED.metrics;
  return (
    <section className="mil-panel p-5" aria-label="K-Whale rejected research log">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.25em] text-down">Rejected research archive</p>
          <h2 className="mt-1 text-base font-extrabold uppercase tracking-wide text-foreground">{KWHALE_REJECTED.title}</h2>
        </div>
        <span className="border border-down/50 bg-down/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-down">
          {KWHALE_REJECTED.status} · NOT A LIVE SIGNAL
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{KWHALE_REJECTED.disclaimer}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Window {KWHALE_REJECTED.window.from} → {KWHALE_REJECTED.window.to}. Separate from confirmed-block reconnaissance above. Hunter scan does not use this engine.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div className="border border-border bg-background/40 p-3"><p className="text-muted-foreground">Total return</p><p className="tabular font-semibold text-down">{pct(m.totalReturn)}</p></div>
        <div className="border border-border bg-background/40 p-3"><p className="text-muted-foreground">CAGR</p><p className="tabular font-semibold text-down">{pct(m.cagr)}</p></div>
        <div className="border border-border bg-background/40 p-3"><p className="text-muted-foreground">Trades / wins</p><p className="tabular font-semibold text-foreground">{m.trades} / {m.wins}</p></div>
        <div className="border border-border bg-background/40 p-3"><p className="text-muted-foreground">BTC BH CAGR</p><p className="tabular font-semibold text-up">{pct(m.buyHoldCagr)}</p></div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="mb-2 text-left text-muted-foreground">Corrected next-open research fills. Fees 0.40% each way. Research only.</caption>
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th scope="col" className="p-2">#</th>
              <th scope="col" className="p-2">Entry fill</th>
              <th scope="col" className="p-2 text-right">Entry px</th>
              <th scope="col" className="p-2">Exit fill</th>
              <th scope="col" className="p-2 text-right">Exit px</th>
              <th scope="col" className="p-2">Reason</th>
              <th scope="col" className="p-2 text-right">Hold d</th>
              <th scope="col" className="p-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {KWHALE_REJECTED.trades.map((t, i) => (
              <tr key={`${t.entryFillDate}-${t.exitFillDate}`} className="border-b border-border/50">
                <td className="tabular p-2">{i + 1}</td>
                <td className="tabular p-2">{t.entryFillDate}</td>
                <td className="tabular p-2 text-right">{money(t.entryFillPrice)}</td>
                <td className="tabular p-2">{t.exitFillDate}</td>
                <td className="tabular p-2 text-right">{money(t.exitFillPrice)}</td>
                <td className="p-2">{t.exitReason}</td>
                <td className="tabular p-2 text-right">{t.holdDays}</td>
                <td className={`tabular p-2 text-right font-semibold ${t.netTradeReturn >= 0 ? "text-up" : "text-down"}`}>{pct(t.netTradeReturn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Worst trade: 2020-03-12 entry ~7935 → 2020-03-13 exit ~4800 (stop), about -40% after fees. Gate failed vs BTC buy-and-hold.
      </p>
    </section>
  );
}
