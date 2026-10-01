import { describe, expect, it } from "vitest";
// @ts-expect-error The Intel engine is maintained as a runtime-only ESM module.
import { classify } from "../news-engine.mjs";

describe("Intel category matching", () => {
  it("does not treat commodity words inside unrelated words as category matches", () => {
    expect(classify("SEC charges boiler room operator with defrauding retail investors")).not.toContain(
      "commodities",
    );
    expect(classify("Oil prices fall after inventory build")).toContain("commodities");
  });
});