import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classify } from "../src/lib/news-engine.mjs";
const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const cases = [
  ["Bitcoin posts gains as rates drop", "crypto"],
  ["Treasury yields fall from multiyear highs", "macro"],
  ["US Navy awards Raytheon missile contract", "defense"],
  ["Google unveils latest AI model", "stocks"],
  ["SEC proposes new fund regulation", "regulation"],
  ["Brent crude rises above $102", "commodities"],
];
for (const [headline, category] of cases)
  assert.ok(classify(headline).includes(category), headline);
assert.ok(!classify("Bitcoin posts gains as rates drop").includes("defense"));
assert.ok(!classify("Google unveils latest AI model").includes("defense"));
const news = read("../src/components/btd/NewsFeed.tsx");
assert.ok(!news.includes("Defense Demand"));
assert.ok(!news.includes("Weather Intel"));
assert.ok(news.includes("not a probability"));
assert.ok(news.includes("item.categories.join"));
const nav = read("../src/components/btd/CommandoHeader.tsx");
assert.ok(nav.includes('tab("medic", "/medic"'));
assert.ok(nav.includes("<details"));
assert.ok(nav.includes("Tools"));
const com = read("../src/routes/communication.tsx");
assert.ok(com.includes("<NewsFeed"));
assert.ok(!com.includes("NOT CONNECTED"));
const ops = read("../src/routes/ops.tsx");
assert.ok(/useDataset\("sergeant",\s*defaultBook\)/.test(ops));
assert.ok(ops.includes("opsLogCsv(rows)"));
assert.ok(!ops.includes("saveSergeantBook"));
assert.ok(!ops.includes("loadSergeantBook"));
for (const f of ["SniperHero", "SergeantHero"]) {
  const src = read("../src/components/btd/" + f + ".tsx");
  assert.ok(src.includes("<details"));
  assert.ok(src.includes("object-contain"));
  assert.ok(!src.includes("object-cover"));
}
const ratings = read("../src/components/btd/RatingBadge.tsx");
assert.ok(!ratings.includes("{sig}"));
assert.ok(ratings.includes("{ratingFor(score).label}"));
console.log("PASS: 8 classification cases + 16 cross-page source regression assertions");
