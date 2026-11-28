import type { PlayerStats } from '~/api';

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

export interface PlayerCombatStats {
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  efficiency: number;
}

export function computePlayerCombatStats(
  playerStats?: PlayerStats,
): PlayerCombatStats {
  const kills = playerStats?.kills?.value ?? 0;
  const deaths = playerStats?.deaths?.value ?? 0;
  const assists = playerStats?.assists?.value ?? 0;

  return {
    kills,
    deaths,
    assists,
    kd: calculateRatio(kills, deaths),
    efficiency: calculateRatio(kills + assists, deaths),
  };
}

export interface CombinedStatsResult {
  matches: number;
  winRateRatio: number;
  winPercentage: number;
  kd: number;
}

export function calculateCombinedStats(
  targetId: string,
  selectedIds: string[],
  statsMap?: Record<string, PlayerStats>,
  countMap?: Record<string, number>,
): CombinedStatsResult {
  const uniqueIds = Array.from(new Set([targetId, ...selectedIds])).filter(
    Boolean,
  );

  const totals = uniqueIds.reduce(
    (acc, id) => {
      const games = countMap?.[id] ?? 0;
      const s = statsMap?.[id];
      const winRatio = s?.standing?.value ?? 0;
      const kdVal = s?.kd?.value ?? 0;

      acc.matches += games;
      acc.wins += winRatio * games;
      acc.weightedKdSum += kdVal * games;

      const hasRawKillsOrDeaths =
        s?.kills?.value !== undefined || s?.deaths?.value !== undefined;
      if (hasRawKillsOrDeaths) {
        acc.hasKillDeathTotals = true;
        acc.kills += s?.kills?.value ?? 0;
        acc.deaths += s?.deaths?.value ?? 0;
      } else if (games > 0) {
        acc.missingKillDeathTotals = true;
      }

      return acc;
    },
    {
      matches: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      hasKillDeathTotals: false,
      missingKillDeathTotals: false,
      weightedKdSum: 0,
    },
  );

  const winRateRatio =
    totals.matches > 0 ? calculateRatio(totals.wins, totals.matches) : 0;
  const winPercentage =
    totals.matches > 0
      ? Math.round(calculatePercentage(totals.wins, totals.matches))
      : 0;

  let kd = 0;
  if (totals.hasKillDeathTotals && !totals.missingKillDeathTotals) {
    kd = calculateRatio(totals.kills, totals.deaths);
  } else if (totals.matches > 0) {
    kd = calculateRatio(totals.weightedKdSum, totals.matches);
  } else if (uniqueIds.length === 1) {
    kd = statsMap?.[targetId]?.kd?.value ?? 0;
  }

  return {
    matches: totals.matches,
    winRateRatio,
    winPercentage,
    kd,
  };
}
