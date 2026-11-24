import type { ChartConfig } from '~/components/ui/chart';
import type { MatchPoint } from '~/lib/metrics';

export const HIGH_VOLUME_MATCH_THRESHOLD = 50;

export type TrendMetricKey = 'kd' | 'kda' | 'winPct' | 'combat';
export type MatchWindowPreset = 'summary' | '10' | '25' | 'all';

export const metricsTrendChartConfig = {
  rollingKd: {
    label: '5-Game Avg K/D',
    color: 'var(--chart-primary)',
  },
  kd: {
    label: 'Match K/D',
    color: 'var(--chart-primary)',
  },
  rollingKda: {
    label: '5-Game Avg Efficiency',
    color: 'var(--chart-secondary)',
  },
  kda: {
    label: 'Match Efficiency',
    color: 'var(--chart-secondary)',
  },
  rollingWinPct: {
    label: '5-Game Win %',
    color: 'var(--chart-primary)',
  },
  rollingKills: {
    label: '5-Game Avg Kills',
    color: 'var(--chart-primary)',
  },
  rollingAssists: {
    label: '5-Game Avg Assists',
    color: 'var(--chart-secondary)',
  },
  rollingDeaths: {
    label: '5-Game Avg Deaths',
    color: 'var(--chart-error)',
  },
} satisfies ChartConfig;

export const METRIC_METADATA: Record<
  TrendMetricKey,
  { title: string; subtitle: string }
> = {
  kd: {
    title: 'K/D Ratio by Match',
    subtitle:
      'Each dot is your K/D in a single match; the solid line tracks your 5-game rolling average.',
  },
  kda: {
    title: 'Efficiency (KDA) by Match',
    subtitle:
      'Each dot is your (Kills + Assists) / Deaths in a single match; the solid line tracks your 5-game average.',
  },
  winPct: {
    title: '5-Game Rolling Win Rate',
    subtitle:
      'Tracks your win percentage over your last 5 matches compared against a 50% even win rate.',
  },
  combat: {
    title: 'Kills, Assists & Deaths (5-Game Avg)',
    subtitle:
      'Tracks your average kills, assists, and deaths per match across a 5-game window.',
  },
};

export function getDefaultWindowPreset(
  totalMatches: number,
  hideKpiTabs: boolean,
): MatchWindowPreset {
  if (totalMatches > HIGH_VOLUME_MATCH_THRESHOLD) {
    return hideKpiTabs ? '25' : 'summary';
  }
  return 'all';
}

export function formatSignedDelta(
  delta: number | null,
  suffix = '',
): string | null {
  if (delta === null || Number.isNaN(delta) || delta === 0) {
    return null;
  }
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}${suffix}`;
}

export function slicePointsForWindow(
  points: MatchPoint[],
  windowPreset: MatchWindowPreset,
): MatchPoint[] {
  if (windowPreset === 'summary') {
    return [];
  }
  if (windowPreset === '10' && points.length > 10) {
    return points.slice(-10);
  }
  if (windowPreset === '25' && points.length > 25) {
    return points.slice(-25);
  }
  return points;
}
