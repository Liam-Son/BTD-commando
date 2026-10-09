import { describe, expect, it } from "vitest";
// @ts-expect-error The Intel engine is maintained as a runtime-only ESM module.
import { classify, cluster, isRecent, isRelevantIntel, parseFeed } from "../news-engine.mjs";

describe("Intel category matching", () => {
  it("does not treat commodity words inside unrelated words as category matches", () => {
    expect(
      classify("SEC charges boiler room operator with defrauding retail investors"),
    ).not.toContain("commodities");
    expect(classify("Oil prices fall after inventory build")).toContain("commodities");
  });

  it("recognizes specialist defense and energy headlines", () => {
    expect(classify("US Air Force awards Boeing a fighter jet contract")).toContain("defense");
    expect(classify("Pakistan weighs direct LNG imports for power plants")).toContain(
      "commodities",
    );
    expect(classify("Dogecoin gains as traders test new DeFi network")).toContain("crypto");
  });

  it("keeps the feed focused on the last seven days", () => {
    const now = Date.parse("2026-10-01T12:00:00Z");
    expect(isRecent("2026-09-29T12:00:00Z", now)).toBe(true);
    expect(isRecent("2026-09-20T12:00:00Z", now)).toBe(false);
    expect(isRecent("not-a-date", now)).toBe(false);
  });

  it("drops untagged routine headlines but preserves tracked and critical items", () => {
    expect(isRelevantIntel(["other"])).toBe(false);
    expect(isRelevantIntel(["other"], ["NVDA"])).toBe(true);
    expect(isRelevantIntel(["other"], [], "critical")).toBe(true);
  });

  it("decodes hexadecimal HTML entities in headlines", () => {
    const items = parseFeed(
      "<rss><channel><item><title>Market&#x2019;s sharp move</title><link>https://example.com/news</link></item></channel></rss>",
      "example.com",
    );
    expect(items[0]?.headline).toBe("Market\u2019s sharp move");
  });

  it("clusters rewrites of the same event without merging unrelated headlines", () => {
    const publishedAt = "2026-10-01T10:00:00Z";
    const groups = cluster([
      {
        headline: "Trump Admits Diesel U.S. Export Ban Could Raise Gasoline Prices",
        url: "https://oilprice.com/news/diesel-ban",
        publisher: "oilprice.com",
        provider: "rss",
        publishedAt,
      },
      {
        headline: "Trump considers diesel export ban, warning it could hurt gasoline users",
        url: "https://cnbc.com/news/diesel-ban",
        publisher: "cnbc.com",
        provider: "rss",
        publishedAt: "2026-10-01T11:00:00Z",
      },
      {
        headline: "Trump meets NATO leaders to discuss European security",
        url: "https://apnews.com/news/nato-meeting",
        publisher: "apnews.com",
        provider: "rss",
        publishedAt: "2026-10-01T11:10:00Z",
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.find((group: (typeof groups)[number]) => group.length === 2)).toBeDefined();
  });
});
