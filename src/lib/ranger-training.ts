/** Deterministic educational arithmetic for Ranger's local calculators. */
export function parseTrainingPercent(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}

export function calculateDrawdown(lossInput: string) {
  const lossPercent = parseTrainingPercent(lossInput);
  if (lossPercent === null) return { valid: false as const, reason: "Enter a number from 0 to 100." };
  if (lossPercent === 100) {
    return { valid: true as const, lossPercent, remainingUnits: 0, recoveryPercent: null };
  }
  return {
    valid: true as const,
    lossPercent,
    remainingUnits: 100 - lossPercent,
    recoveryPercent: (lossPercent / (100 - lossPercent)) * 100,
  };
}

export function calculateConcentrationStress(sleeveInput: string, positionLossInput: string) {
  const sleevePercent = parseTrainingPercent(sleeveInput);
  const positionLossPercent = parseTrainingPercent(positionLossInput);
  if (sleevePercent === null || positionLossPercent === null) {
    return { valid: false as const, reason: "Enter numbers from 0 to 100 for both fields." };
  }
  const portfolioLossUnits = (sleevePercent * positionLossPercent) / 100;
  return {
    valid: true as const,
    startingUnits: 100,
    sleevePercent,
    positionLossPercent,
    portfolioLossUnits,
    remainingCapitalUnits: 100 - portfolioLossUnits,
  };
}