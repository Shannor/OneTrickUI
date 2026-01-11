interface Options {
  round?: boolean;
  decimalPlaces?: number;
}
export function calculateRatio(
  numerator: number,
  denominator: number,
  options: Options = { round: true, decimalPlaces: 2 },
): number {
  if (denominator === 0) {
    return numerator;
  }
  const amount = Math.pow(10, options.decimalPlaces ?? 2);
  return calculatePercentage(numerator, denominator, options) / amount;
}

export function calculatePercentage(
  numerator: number,
  denominator: number,
  options: Options = { round: true, decimalPlaces: 2 },
): number {
  if (denominator === 0) {
    return numerator;
  }
  const amount = Math.pow(10, options.decimalPlaces ?? 2);

  if (options.round === false) {
    return (numerator / denominator) * amount;
  }

  return Math.round((numerator / denominator) * amount);
}
