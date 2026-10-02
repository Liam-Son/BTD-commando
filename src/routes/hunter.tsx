import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { useAuth } from "@/hooks/useAuth";
import { matchingTransfers, scanConfirmedBitcoin, thresholdSats, SAMPLE_LIMIT, type HunterScan } from "@/lib/hunter";

export const Route = createFileRoute("/hunter")({
  head: () => ({ meta: [{ title: "Hunter | BTD Commando" }, { name: "description", content: "Read-only Bitcoin confirmed-transfer reconnaissance. Sampled public explorer data, not buy signals or wallet identities." }] }),
  component: Hunter,
});
const control = "border border-border bg-surface-2 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
const utc = (seconds: number) => new Date(seconds * 1000).toISOString().replace("T", " ").replace(".000Z", " UTC");
const btc = (sats: number) => (sats / 100000000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });

function Hunter() {
  const { user } = useAuth();
  const [threshold, setThreshold] = useState("100");
  const [scan, setScan] = useState<HunterScan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  const minimum = thresholdSats(threshold);
  const matches = scan && minimum !== null ? matchingTransfers(scan.transfers, minimum) : [];
  async function runScan() {
    if (request.current || minimum === null) return;
    const controller = new AbortController(); request.current = controller;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 30000);
    setLoading(true); setError(null); setScan(null);
    try {
      const result = await scanConfirmedBitcoin(controller.signal);
      if (!controller.signal.aborted && request.current === controller) setScan(result);
    } catch (cause) {
      if (request.current === controller) setError(controller.signal.aborted ? timedOut ? "Scan timed out after 30 seconds. Retry when the explorer is available." : "Scan cancelled. No partial results published." : cause instanceof Error ? cause.message : "Explorer unavailable. Check your connection and retry.");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) { request.current = null; setLoading(false); }
    }
  }
  return <main className="min-h-screen bg-background">
    <CommandoHeader active="hunter" signedIn={!!user} status={<span>{loading ? "Recon in progress" : "Manual recon · BTC only"}</span>} />
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6">
      <section className="mil-panel p-6">
        <p className="text-[10px] uppercase tracking-widest text-primary">Hunter · on-chain reconnaissance</p>
        <h1 className="pixel-title mt-2 text-4xl text-primary">Track large BTC transfers</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">Observe large confirmed transactions, not whale buys. Public Bitcoin outputs cannot identify a trader, reveal intent, or prove a purchase. Hunter is separate from Ranger survival lessons and never changes BTD scores.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="border border-primary/40 px-2 py-1 text-primary">BTC MAINNET · AVAILABLE</span><span className="border border-border px-2 py-1 text-muted-foreground">ETH / SOL / OTHER CHAINS · UNAVAILABLE</span></div>
      </section>
      <section className="mil-panel space-y-4 p-5" aria-labelledby="recon-controls">
        <h2 id="recon-controls" className="text-sm font-bold uppercase tracking-widest">Mission parameters</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div><label htmlFor="hunter-threshold" className="mb-1 block text-xs">Minimum estimated output sum (BTC)</label><input id="hunter-threshold" type="text" inputMode="decimal" value={threshold} onChange={(event) => setThreshold(event.target.value)} aria-invalid={minimum === null} aria-describedby="hunter-threshold-help" className={control + " w-52 tabular"} /></div>
          <button type="button" onClick={runScan} disabled={loading || minimum === null} className={control + " border-primary/60 font-semibold text-primary"}>{loading ? "Scanning confirmed block…" : "Scan confirmed BTC transfers"}</button>
          {loading && <button type="button" onClick={() => request.current?.abort()} className={control}>Cancel scan</button>}
        </div>
        <p id="hunter-threshold-help" className={"text-xs " + (minimum === null ? "text-warn" : "text-muted-foreground")}>{minimum === null ? "Enter a positive BTC amount up to 21,000,000 with at most 8 decimal places." : "Threshold filters this sample instantly. It does not trigger a new network scan."}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">No automatic scans. Your click sends read-only requests to Blockstream from your browser (the provider may see your IP). Each scan reads the latest confirmed block at request time and its first {SAMPLE_LIMIT} transactions in block order. This is a bounded, non-random sample, not network-wide coverage or a live stream. No keys, private wallet uploads, or trade orders.</p>
      </section>
      <div role="status" aria-live="polite" className="text-sm text-muted-foreground">{loading ? "Fetching block metadata and up to four transaction pages. Timeout: 30 seconds." : scan ? "Scan complete. " + matches.length + " sampled transactions match the current threshold." : !error ? "Ready for manual recon. No transfer data loaded." : ""}</div>
      {error && <p role="alert" className="border border-down/40 bg-down/10 p-4 text-sm text-down">{error}</p>}
      {scan && <section className="mil-panel p-5" aria-labelledby="sample-results">
        <h2 id="sample-results" className="text-lg font-bold">Confirmed block #{scan.height.toLocaleString("en-US")}</h2>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <p>Block source timestamp: {utc(scan.blockTime)} · Retrieved: {scan.fetchedAt}</p>
          <p>Coverage: {scan.sampled} / {scan.totalTransactions.toLocaleString("en-US")} block transactions ({(scan.sampled / scan.totalTransactions * 100).toFixed(2)}%). {scan.excludedCoinbase} coinbase transaction(s) excluded from transfer results.</p>
          <p>Best-chain status verified at scan completion; later reorganizations are possible. Refresh manually to check a newer snapshot.</p>
          <a href={"https://blockstream.info/block/" + scan.hash} target="_blank" rel="noopener noreferrer" className="inline-block break-all text-primary underline">Verify source block ↗</a>
        </div>
        {minimum === null ? <p className="mt-5 text-sm text-warn">Fix the threshold to display matching transfers.</p> : matches.length === 0 ? <p className="mt-5 text-sm">No sampled transfers meet this threshold. This does not mean no large transfers occurred elsewhere in this block or network.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="mb-3 text-left text-muted-foreground">Estimated transfer size = sum of all transaction outputs, including change and possible self-transfers. Not net movement, trading volume, buys, or unique whale count. Sorted by output sum.</caption><thead className="border-b border-border text-muted-foreground"><tr><th scope="col" className="p-2">Transaction / public evidence</th><th scope="col" className="p-2 text-right">Estimated output sum (BTC)</th><th scope="col" className="p-2 text-right">Outputs</th><th scope="col" className="p-2">Block timestamp (UTC)</th></tr></thead><tbody>{matches.map((tx) => <tr key={tx.txid} className="border-b border-border/50"><td className="p-2"><a href={"https://blockstream.info/tx/" + tx.txid} target="_blank" rel="noopener noreferrer" aria-label={"View Bitcoin transaction " + tx.txid} title={tx.txid} className="tabular text-primary underline">{tx.txid.slice(0, 12)}…{tx.txid.slice(-8)} ↗</a></td><td className="tabular whitespace-nowrap p-2 text-right text-primary">{btc(tx.outputSats)}</td><td className="tabular p-2 text-right">{tx.outputCount}</td><td className="tabular whitespace-nowrap p-2">{utc(tx.blockTime)}</td></tr>)}</tbody></table></div>}
      </section>}
      <section className="mil-panel p-5 text-sm leading-relaxed text-muted-foreground"><h2 className="mb-2 font-bold text-foreground">Rules of engagement</h2><p>A large output sum is not evidence of accumulation, a named institution, an exchange deposit, or a real buy. Transactions can batch payments, consolidate funds, or return change. No identity or trading-direction inference is made here. Research only, not investment advice.</p><a href="https://github.com/Blockstream/esplora/blob/master/API.md" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-primary underline">Source: Blockstream Esplora API documentation ↗</a></section>
    </div>
  </main>;
}
