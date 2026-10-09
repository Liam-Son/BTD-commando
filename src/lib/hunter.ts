/** Read-only Bitcoin mainnet reconnaissance. Esplora amounts are satoshis.
 * Docs: https://github.com/Blockstream/esplora/blob/master/API.md
 */
export const HUNTER_API = "https://blockstream.info/api";
export const SAMPLE_LIMIT = 100;
export const SAMPLE_LIMITS = [100, 250, 500] as const;
const PAGE_SIZE = 25;
const MAX_PAGES = 20;
export type HunterTransfer = {
  txid: string;
  outputSats: number;
  outputCount: number;
  blockTime: number;
};
export type HunterScan = {
  hash: string;
  height: number;
  blockTime: number;
  totalTransactions: number;
  sampled: number;
  excludedCoinbase: number;
  transfers: HunterTransfer[];
  fetchedAt: string;
};
export type HunterProgress = {
  stage: "block" | "sampling" | "verifying";
  sampled: number;
  sampleLimit: number;
  page: number;
  pages: number;
};
export type HunterScanOptions = {
  sampleLimit?: number;
  onProgress?: (progress: HunterProgress) => void;
};
const hashPattern = /^[a-f0-9]{64}$/;
function record(value: unknown): any {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid explorer response.");
  return value;
}
function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new Error("Invalid explorer numeric data.");
  return value;
}
function optionsFor(options?: HunterScanOptions): Required<HunterScanOptions> {
  if (options !== undefined && (!options || typeof options !== "object" || Array.isArray(options)))
    throw new Error("Invalid scan options.");
  const sampleLimit = options?.sampleLimit ?? SAMPLE_LIMIT;
  if (!SAMPLE_LIMITS.includes(sampleLimit as (typeof SAMPLE_LIMITS)[number]))
    throw new Error("Sample limit must be 100, 250, or 500.");
  if (options?.onProgress !== undefined && typeof options.onProgress !== "function")
    throw new Error("Invalid scan progress callback.");
  return { sampleLimit, onProgress: options?.onProgress ?? (() => {}) };
}
export function parseTransfer(value: unknown, hash: string): HunterTransfer | null {
  const tx = record(value),
    status = record(tx.status);
  if (
    typeof tx.txid !== "string" ||
    !hashPattern.test(tx.txid) ||
    status.confirmed !== true ||
    status.block_hash !== hash ||
    !Array.isArray(tx.vin) ||
    !tx.vin.length ||
    !Array.isArray(tx.vout) ||
    !tx.vout.length
  )
    throw new Error("Explorer transaction did not match the confirmed block.");
  if (tx.vin.some((input: unknown) => record(input).is_coinbase === true)) return null;
  const outputSats = tx.vout.reduce((sum: number, output: unknown) => {
    const value = integer(record(output).value);
    const next = sum + value;
    return integer(next);
  }, 0);
  return {
    txid: tx.txid,
    outputSats,
    outputCount: tx.vout.length,
    blockTime: integer(status.block_time),
  };
}
export function thresholdSats(input: string): number | null {
  if (!/^(?:\d+)(?:\.\d{1,8})?$/.test(input)) return null;
  const value = Number(input);
  return Number.isFinite(value) && value > 0 && value <= 21000000
    ? Math.round(value * 100000000)
    : null;
}
export function matchingTransfers(transfers: HunterTransfer[], minimum: number): HunterTransfer[] {
  return transfers
    .filter((tx) => tx.outputSats >= minimum)
    .sort((a, b) => b.outputSats - a.outputSats);
}
export async function scanConfirmedBitcoin(
  signal: AbortSignal,
  options?: HunterScanOptions,
): Promise<HunterScan> {
  const { sampleLimit, onProgress } = optionsFor(options);
  async function get(endpoint: string, text = false): Promise<unknown> {
    const response = await fetch(HUNTER_API + endpoint, {
      signal,
      credentials: "omit",
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error("Blockstream returned HTTP " + response.status + ". Retry later.");
    return text ? response.text() : response.json();
  }
  onProgress({ stage: "block", sampled: 0, sampleLimit, page: 0, pages: 0 });
  const rawHash = await get("/blocks/tip/hash", true),
    hash = typeof rawHash === "string" ? rawHash.trim() : "";
  if (!hashPattern.test(hash)) throw new Error("Invalid explorer block hash.");
  const block = record(await get("/block/" + hash));
  if (block.id !== hash) throw new Error("Explorer block mismatch.");
  const height = integer(block.height),
    blockTime = integer(block.timestamp),
    totalTransactions = integer(block.tx_count);
  if (!totalTransactions) throw new Error("Explorer returned an empty block.");
  const target = Math.min(sampleLimit, totalTransactions),
    pages = Math.ceil(target / PAGE_SIZE);
  if (pages > MAX_PAGES) throw new Error("Sample exceeds the 20-page safety limit.");
  const transfers: HunterTransfer[] = [];
  let sampled = 0,
    excludedCoinbase = 0;
  const seen = new Set<string>();
  for (let start = 0; start < target; start += PAGE_SIZE) {
    const expected = Math.min(PAGE_SIZE, target - start),
      page = await get("/block/" + hash + "/txs/" + start);
    if (!Array.isArray(page) || page.length !== expected)
      throw new Error("Incomplete explorer sample. No results published.");
    for (const raw of page) {
      const id = record(raw).txid;
      if (typeof id !== "string" || !hashPattern.test(id) || seen.has(id))
        throw new Error("Duplicate or invalid explorer transaction.");
      seen.add(id);
      sampled++;
      const tx = parseTransfer(raw, hash);
      if (tx) transfers.push(tx);
      else excludedCoinbase++;
    }
    onProgress({
      stage: "sampling",
      sampled,
      sampleLimit: target,
      page: start / PAGE_SIZE + 1,
      pages,
    });
  }
  onProgress({ stage: "verifying", sampled, sampleLimit: target, page: pages, pages });
  const chainStatus = record(await get("/block/" + hash + "/status"));
  if (chainStatus.in_best_chain !== true)
    throw new Error("Sampled block left the best chain. Scan again.");
  return {
    hash,
    height,
    blockTime,
    totalTransactions,
    sampled,
    excludedCoinbase,
    transfers,
    fetchedAt: new Date().toISOString(),
  };
}
