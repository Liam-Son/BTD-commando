/** Read-only Bitcoin mainnet reconnaissance. Esplora amounts are satoshis.
 * Docs: https://github.com/Blockstream/esplora/blob/master/API.md
 */
export const HUNTER_API = "https://blockstream.info/api";
export const SAMPLE_LIMIT = 100;
export type HunterTransfer = { txid: string; outputSats: number; outputCount: number; blockTime: number };
export type HunterScan = { hash: string; height: number; blockTime: number; totalTransactions: number; sampled: number; excludedCoinbase: number; transfers: HunterTransfer[]; fetchedAt: string };
const hashPattern = /^[a-f0-9]{64}$/;
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid explorer response.");
  return value as Record<string, unknown>;
}
function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("Invalid explorer numeric data.");
  return value;
}
export function parseTransfer(value: unknown, hash: string): HunterTransfer | null {
  const tx = record(value); const status = record(tx.status);
  if (typeof tx.txid !== "string" || !hashPattern.test(tx.txid) || status.confirmed !== true || status.block_hash !== hash || !Array.isArray(tx.vin) || !tx.vin.length || !Array.isArray(tx.vout) || !tx.vout.length) throw new Error("Explorer transaction did not match the confirmed block.");
  if (tx.vin.some((input) => record(input).is_coinbase === true)) return null;
  const outputSats = tx.vout.reduce((sum: number, output: unknown) => sum + integer(record(output).value), 0);
  integer(outputSats);
  return { txid: tx.txid, outputSats, outputCount: tx.vout.length, blockTime: integer(status.block_time) };
}
export function thresholdSats(input: string): number | null {
  if (!/^(?:\d+)(?:\.\d{1,8})?$/.test(input)) return null;
  const value = Number(input);
  return Number.isFinite(value) && value > 0 && value <= 21000000 ? Math.round(value * 100000000) : null;
}
export function matchingTransfers(transfers: HunterTransfer[], minimum: number): HunterTransfer[] {
  return transfers.filter((tx) => tx.outputSats >= minimum).sort((a, b) => b.outputSats - a.outputSats);
}
export async function scanConfirmedBitcoin(signal: AbortSignal): Promise<HunterScan> {
  async function get(endpoint: string, text = false): Promise<unknown> {
    const response = await fetch(HUNTER_API + endpoint, { signal, credentials: "omit", cache: "no-store" });
    if (!response.ok) throw new Error("Blockstream returned HTTP " + response.status + ". Retry later.");
    return text ? response.text() : response.json();
  }
  const rawHash = await get("/blocks/tip/hash", true);
  const hash = typeof rawHash === "string" ? rawHash.trim() : "";
  if (!hashPattern.test(hash)) throw new Error("Invalid explorer block hash.");
  const block = record(await get("/block/" + hash));
  if (block.id !== hash) throw new Error("Explorer block mismatch.");
  const height = integer(block.height), blockTime = integer(block.timestamp), totalTransactions = integer(block.tx_count);
  if (!totalTransactions) throw new Error("Explorer returned an empty block.");
  const transfers: HunterTransfer[] = []; let sampled = 0, excludedCoinbase = 0;
  const seen = new Set<string>();
  for (let start = 0; start < Math.min(SAMPLE_LIMIT, totalTransactions); start += 25) {
    const page = await get("/block/" + hash + "/txs/" + start);
    if (!Array.isArray(page) || page.length !== Math.min(25, totalTransactions - start)) throw new Error("Incomplete explorer sample. No results published.");
    for (const raw of page) {
      const id = record(raw).txid;
      if (typeof id !== "string" || seen.has(id)) throw new Error("Duplicate or invalid explorer transaction.");
      seen.add(id); sampled++;
      const tx = parseTransfer(raw, hash);
      if (tx) transfers.push(tx); else excludedCoinbase++;
    }
  }
  const chainStatus = record(await get("/block/" + hash + "/status"));
  if (chainStatus.in_best_chain !== true) throw new Error("Sampled block left the best chain. Scan again.");
  return { hash, height, blockTime, totalTransactions, sampled, excludedCoinbase, transfers, fetchedAt: new Date().toISOString() };
}
