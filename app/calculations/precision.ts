export function calculateRatio(numerator: number, denominator: number): number {
  if (denominator === 0 || numerator === 0) {
    return numerator;
  }

  return numerator / denominator;
}

export function calculatePercentage(
  numerator: number,
  denominator: number,
): number {
  if (denominator === 0 || numerator === 0) {
    return numerator;
  }
  const ratio = calculateRatio(numerator, denominator);
  return ratio * 100;
}
