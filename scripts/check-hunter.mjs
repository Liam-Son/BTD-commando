import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { Buffer } from "node:buffer";
import assert from "node:assert/strict";

const source = await readFile(process.env.HUNTER_LIB_PATH ?? new URL("../src/lib/hunter.ts", import.meta.url), "utf8");
const hunter = await import("data:text/javascript;base64," + Buffer.from(stripTypeScriptTypes(source)).toString("base64"));
const hash = "a".repeat(64);
const txid = (n) => n.toString(16).padStart(64, "0");
const tx = (n, { coinbase = false, blockHash = hash, value = 100_000_000 } = {}) => ({ txid: txid(n), status: { confirmed: true, block_hash: blockHash, block_time: 1_700_000_000 }, vin: [coinbase ? { is_coinbase: true } : { txid: txid(n + 9000) }], vout: [{ value }] });
function response(body, status = 200, text = false) { return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => text ? body : JSON.stringify(body) }; }
function install({ count = 500, mutate, bestChain = true } = {}) { globalThis.fetch = async (url, { signal } = {}) => { if (signal?.aborted) throw new DOMException("Aborted", "AbortError"); const path = new URL(url).pathname.replace("/api", ""); if (path === "/blocks/tip/hash") return response(hash, 200, true); if (path === `/block/${hash}`) return response({ id: hash, height: 123, timestamp: 1_700_000_000, tx_count: count }); if (path === `/block/${hash}/status`) return response({ in_best_chain: bestChain }); const match = path.match(new RegExp(`/block/${hash}/txs/(\\d+)$`)); if (match) { const start = Number(match[1]); const page = Array.from({ length: Math.min(25, count - start) }, (_, i) => tx(start + i + 1, { coinbase: start + i === 0 })); return response(mutate ? mutate(page, start) : page); } throw new Error("Unexpected endpoint " + path); }; }
const originalFetch = globalThis.fetch;
try {
  for (const limit of [100, 250, 500]) { install(); const progress = []; const result = await hunter.scanConfirmedBitcoin(new AbortController().signal, { sampleLimit: limit, onProgress: (entry) => progress.push(entry) }); assert.equal(result.sampled, limit); assert.equal(result.excludedCoinbase, 1); assert.equal(progress.filter((entry) => entry.stage === "sampling").length, limit / 25); }
  install({ mutate: (page, start) => start === 0 ? { bad: true } : page }); await assert.rejects(() => hunter.scanConfirmedBitcoin(new AbortController().signal), /Incomplete explorer sample/);
  install({ mutate: (page, start) => start === 25 ? page.map((item, i) => i === 0 ? { ...item, txid: txid(1) } : item) : page }); await assert.rejects(() => hunter.scanConfirmedBitcoin(new AbortController().signal, { sampleLimit: 100 }), /Duplicate/);
  install({ mutate: (page, start) => start === 0 ? page.map((item, i) => i === 1 ? { ...item, status: { ...item.status, block_hash: "b".repeat(64) } } : item) : page }); await assert.rejects(() => hunter.scanConfirmedBitcoin(new AbortController().signal), /did not match/);
  install({ bestChain: false }); await assert.rejects(() => hunter.scanConfirmedBitcoin(new AbortController().signal), /best chain/);
  install(); const cancelled = new AbortController(); cancelled.abort(); await assert.rejects(() => hunter.scanConfirmedBitcoin(cancelled.signal), /Abort/);
  for (const invalid of ["0", "21000000.00000001", "1.000000001", "nope"]) assert.equal(hunter.thresholdSats(invalid), null);
  assert.equal(hunter.thresholdSats("1"), 100_000_000); assert.equal(hunter.thresholdSats("21000000"), 2_100_000_000_000_000);
  for (const invalid of [99, 101, 501]) await assert.rejects(() => hunter.scanConfirmedBitcoin(new AbortController().signal, { sampleLimit: invalid }), /Sample limit/);
  await assert.rejects(() => hunter.scanConfirmedBitcoin(new AbortController().signal, { onProgress: "bad" }), /callback/);
  console.log("Hunter checks passed: sample 100/250/500 paging, invalid response, transaction and best-chain mismatch, duplicates, coinbase exclusion, cancellation, threshold bounds, and no partial returns.");
} finally { globalThis.fetch = originalFetch; }