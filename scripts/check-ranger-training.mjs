import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const source = await readFile(new URL("../src/lib/ranger-training.ts", import.meta.url), "utf8");
const javascript = stripTypeScriptTypes(source, { mode: "strip" });
const training = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const value of ["", "   ", "NaN", "-1", "100.1", "Infinity"]) assert(training.parseTrainingPercent(value) === null, `reject ${JSON.stringify(value)}`);
assert(training.parseTrainingPercent("0") === 0, "accept zero boundary");
assert(training.parseTrainingPercent("100") === 100, "accept 100 boundary");
const totalLoss = training.calculateDrawdown("100");
assert(totalLoss.valid && totalLoss.remainingUnits === 0 && totalLoss.recoveryPercent === null, "handle 100% drawdown");
const stress = training.calculateConcentrationStress("25", "40");
assert(stress.valid && stress.portfolioLossUnits === 10 && stress.remainingCapitalUnits === 90, "calculate 25% × 40% stress");
assert(!training.calculateConcentrationStress("", "40").valid, "reject blank sleeve");
assert(!training.calculateConcentrationStress("25", "NaN").valid, "reject NaN loss");
assert(training.calculateConcentrationStress("100", "100").remainingCapitalUnits === 0, "handle 100% sleeve and loss");
console.log("Ranger training checks passed.");