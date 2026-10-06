import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

// Execute the exact TypeScript helper using Node’s built-in type stripper.
const source = await readFile(new URL("../src/lib/intel-search.ts", import.meta.url), "utf8");
const helper = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`);

const items = [
  { headline: "Oil supply update", publisher: "Wire Desk", tickers: ["CL"], summary: "Production outlook", categories: ["commodities"] },
  { headline: "Rates watch", publisher: "Macro Monitor", tickers: ["TLT"], summary: "Central bank calendar", categories: ["macro"] },
];

assert.deepEqual(helper.filterIntelItems(items, "all", "  "), items, "blank search retains all selected items");
assert.deepEqual(helper.filterIntelItems(items, "commodities", "  cl  "), [items[0]], "category and ticker search combine");
assert.deepEqual(helper.filterIntelItems(items, "MACRO", "CENTRAL BANK"), [items[1]], "search and category are case-insensitive");
assert.deepEqual(helper.filterIntelItems(items, "stocks", "oil"), [], "category filters before search");
assert.equal(helper.normalizeIntelSearch("  Wire   Desk "), "wire desk", "normalization trims and folds whitespace");

console.log("intel-search checks passed");