import type { ChartConfig } from '~/components/ui/chart';
import type { MatchPoint } from '~/lib/metrics';

export const HIGH_VOLUME_MATCH_THRESHOLD = 50;
export const SHORT_MATCH_WINDOW = 10;
export const MEDIUM_MATCH_WINDOW = 25;
export const MAX_COMBAT_DOT_POINTS = 4;
export const MIN_SPARKLINE_POINTS = 2;
export const SPARKLINE_WIDTH = 88;
export const SPARKLINE_HEIGHT = 26;
export const SPARKLINE_VERTICAL_PADDING = 2;
export const DEFAULT_OUTCOME_DOT_RADIUS = 3.5;
export const WIN_PCT_DOT_RADIUS = 3;
export const ACTIVE_OUTCOME_DOT_RADIUS = 5;

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
  if (windowPreset === '10' && points.length > SHORT_MATCH_WINDOW) {
    return points.slice(-SHORT_MATCH_WINDOW);
  }
  if (windowPreset === '25' && points.length > MEDIUM_MATCH_WINDOW) {
    return points.slice(-MEDIUM_MATCH_WINDOW);
  }
  return points;
}
