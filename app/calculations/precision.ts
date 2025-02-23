export function calculateRatio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return calculatePercentage(numerator, denominator) / 100;
}

export function calculatePercentage(
  numerator: number,
  denominator: number,
): number {
  if (denominator === 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 100);
}
