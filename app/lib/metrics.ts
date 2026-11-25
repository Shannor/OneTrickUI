import {
  addMinutes,
  endOfToday,
  format,
  startOfToday,
  subHours,
  subMinutes,
  subMonths,
  subWeeks,
} from 'date-fns';
import type {
  Aggregate,
  GameMode,
  TelemetryMatch,
  TelemetrySnapshotSummary,
} from '~/api';
import { calculatePercentage, calculateRatio } from '~/calculations/precision';

interface KDA {
  kills: number;
  deaths: number;
  assists: number;
  gameCount: number;
  wins: number;
}

export interface MapResult {
  location: string;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kd: number;
  kda: number;
  wins: number;
  winRatio: number;
  loses: number;
  count: number;
}

export type MapSignal = 'strong' | 'swap' | 'neutral' | 'low-sample';

export interface MapBestLoadout {
  snapshotId: string;
  name: string;
  kd: number;
  winPct: number;
  count: number;
}

export interface MapTelemetryResult extends MapResult {
  winPct: number;
  signal: MapSignal;
  bestLoadout?: MapBestLoadout;
}

export interface MatchPoint {
  matchIndex: number;
  activityId: string;
  time: string;
  shortLabel: string;
  fullLabel: string;
  location: string;
  kills: number;
  deaths: number;
  assists: number;
  won: boolean;
  kd: number;
  kda: number;
  winPct: number;
  rollingKd: number;
  rollingKda: number;
  rollingWinPct: number;
  rollingKills: number;
  rollingDeaths: number;
  rollingAssists: number;
  kdBand: [number, number];
  kdaBand: [number, number];
  killsBand: [number, number];
}

export interface TelemetrySummary {
  games: number;
  wins: number;
  losses: number;
  winPct: number;
  kills: number;
  deaths: number;
  assists: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kd: number;
  kda: number;
  kdDelta: number | null;
  kdaDelta: number | null;
  winPctDelta: number | null;
}

export type CustomTimeWindow = {
  start: Date;
  end: Date;
};

export type TimeWindow =
  | 'one-day'
  | 'one-week'
  | 'one-month'
  | 'six-months'
  | 'all-time'
  | 'last-hour'
  | 'last-3-hours'
  | 'last-6-hours';

export const DEFAULT_ROLLING_WINDOW = 5;
export const MIN_MAP_SAMPLE_FOR_SIGNAL = 2;
export const EVEN_KD_TARGET = 1;
export const TARGET_EFFICIENCY_KDA = 1.5;
export const EVEN_WIN_RATE_PCT = 50;
export const MAX_WIN_RATE_PCT = 100;

const ALL_TIME_BUFFER_MINUTES = 30;
const STRONG_SIGNAL_KD = 1.25;
const DOMINANT_SIGNAL_KD = 1.5;
const SWAP_SIGNAL_MAX_KD = 0.95;
const SWAP_SIGNAL_LOW_WIN_PCT = 35;
const SWAP_SIGNAL_LOW_WIN_MAX_KD = 1.2;

export function aggregatesToTelemetryMatches(
  aggregates: readonly Aggregate[],
  characterId: string,
): TelemetryMatch[] {
  const matches: TelemetryMatch[] = [];
  for (const agg of aggregates) {
    const perf = agg.performance?.[characterId];
    if (!perf) {
      continue;
    }
    const link = agg.snapshotLinks?.[characterId];
    matches.push({
      activityId: agg.activityId || agg.id,
      period: agg.activityDetails.period,
      location: agg.activityDetails.location || '',
      activity: agg.activityDetails.activity || '',
      estimatedGameMode: agg.activityDetails.estimatedGameMode,
      kills: perf.playerStats.kills?.value ?? 0,
      deaths: perf.playerStats.deaths?.value ?? 0,
      assists: perf.playerStats.assists?.value ?? 0,
      won: perf.playerStats.standing?.value === 0,
      snapshotId: link?.snapshotId,
      snapshotConfidence: link?.confidenceLevel,
    });
  }
  return matches;
}

export function timeWindowToCustom(
  time: TimeWindow | CustomTimeWindow,
  matches: readonly TelemetryMatch[],
): CustomTimeWindow {
  if (typeof time !== 'string') {
    return time;
  }

  const end = new Date();
  switch (time) {
    case 'last-hour':
      return { start: subHours(end, 1), end };
    case 'last-3-hours':
      return { start: subHours(end, 3), end };
    case 'last-6-hours':
      return { start: subHours(end, 6), end };
    case 'one-day':
      return { start: startOfToday(), end: endOfToday() };
    case 'one-week':
      return { start: subWeeks(startOfToday(), 1), end };
    case 'one-month':
      return { start: subMonths(startOfToday(), 1), end };
    case 'six-months':
      return { start: subMonths(startOfToday(), 6), end };
    case 'all-time': {
      if (!matches || matches.length === 0) {
        return { start: subHours(end, 1), end };
      }
      let minMs = Infinity;
      let maxMs = -Infinity;
      for (const match of matches) {
        const periodMs = new Date(match.period).getTime();
        if (Number.isNaN(periodMs)) {
          continue;
        }
        if (periodMs < minMs) {
          minMs = periodMs;
        }
        if (periodMs > maxMs) {
          maxMs = periodMs;
        }
      }
      if (!Number.isFinite(minMs) || !Number.isFinite(maxMs)) {
        return { start: subHours(end, 1), end };
      }
      return {
        start: subMinutes(new Date(minMs), ALL_TIME_BUFFER_MINUTES),
        end: addMinutes(new Date(maxMs), ALL_TIME_BUFFER_MINUTES),
      };
    }
  }
}

export function classifyMapSignal(
  count: number,
  kd: number,
  winPct: number,
): MapSignal {
  if (count < MIN_MAP_SAMPLE_FOR_SIGNAL) {
    return 'low-sample';
  }
  if (
    (kd >= STRONG_SIGNAL_KD && winPct >= EVEN_WIN_RATE_PCT) ||
    kd >= DOMINANT_SIGNAL_KD
  ) {
    return 'strong';
  }
  if (
    kd < SWAP_SIGNAL_MAX_KD ||
    (winPct <= SWAP_SIGNAL_LOW_WIN_PCT && kd < SWAP_SIGNAL_LOW_WIN_MAX_KD)
  ) {
    return 'swap';
  }
  return 'neutral';
}

interface RawMatchSample {
  kills: number;
  deaths: number;
  assists: number;
  won: boolean;
}

export function summarizeMatchSamples(
  current: RawMatchSample[],
  prior: RawMatchSample[] = [],
): TelemetrySummary {
  const totals = current.reduce(
    (acc, m) => {
      acc.kills += m.kills;
      acc.deaths += m.deaths;
      acc.assists += m.assists;
      acc.wins += m.won ? 1 : 0;
      return acc;
    },
    { kills: 0, deaths: 0, assists: 0, wins: 0 },
  );

  const games = current.length;
  const losses = games - totals.wins;
  const winPct =
    games > 0 ? Math.round(calculatePercentage(totals.wins, games)) : 0;
  const kd = games > 0 ? calculateRatio(totals.kills, totals.deaths) : 0;
  const kda =
    games > 0
      ? calculateRatio(totals.kills + totals.assists, totals.deaths)
      : 0;

  let kdDelta: number | null = null;
  let kdaDelta: number | null = null;
  let winPctDelta: number | null = null;

  if (games > 0 && prior.length > 0) {
    const priorSums = prior.reduce(
      (acc, m) => ({
        k: acc.k + m.kills,
        d: acc.d + m.deaths,
        a: acc.a + m.assists,
        w: acc.w + (m.won ? 1 : 0),
      }),
      { k: 0, d: 0, a: 0, w: 0 },
    );

    const priorKd = calculateRatio(priorSums.k, priorSums.d);
    const priorKda = calculateRatio(priorSums.k + priorSums.a, priorSums.d);
    const priorWin = calculatePercentage(priorSums.w, prior.length);

    kdDelta = Number((kd - priorKd).toFixed(2));
    kdaDelta = Number((kda - priorKda).toFixed(2));
    winPctDelta = Math.round(
      calculatePercentage(totals.wins, games) - priorWin,
    );
  }

  return {
    games,
    wins: totals.wins,
    losses,
    winPct,
    kills: totals.kills,
    deaths: totals.deaths,
    assists: totals.assists,
    avgKills: games > 0 ? calculateRatio(totals.kills, games) : 0,
    avgDeaths: games > 0 ? calculateRatio(totals.deaths, games) : 0,
    avgAssists: games > 0 ? calculateRatio(totals.assists, games) : 0,
    kd,
    kda,
    kdDelta,
    kdaDelta,
    winPctDelta,
  };
}

export function generateMatchSeries(
  matches: readonly TelemetryMatch[],
  time: CustomTimeWindow,
  filterBy?: GameMode,
  rollingWindow: number = DEFAULT_ROLLING_WINDOW,
): { points: MatchPoint[]; summary: TelemetrySummary } {
  const startMs = new Date(time.start).getTime();
  const endMs = new Date(time.end).getTime();
  const durationMs = Math.max(0, endMs - startMs);

  const allModeMatched = matches
    .filter((m) => matchesGameMode(m, filterBy))
    .map((match) => {
      const period = new Date(match.period);
      return {
        activityId: match.activityId,
        period,
        periodMs: period.getTime(),
        location: match.location || 'Unknown Map',
        kills: match.kills,
        deaths: match.deaths,
        assists: match.assists,
        won: match.won,
        kd: calculateRatio(match.kills, match.deaths),
        kda: calculateRatio(match.kills + match.assists, match.deaths),
      };
    })
    .sort((a, b) => a.periodMs - b.periodMs);

  const validMatches = allModeMatched.filter(
    (m) => m.periodMs >= startMs && m.periodMs <= endMs,
  );
  const allBeforeStart = allModeMatched.filter((m) => m.periodMs < startMs);
  const equalDurationPrior =
    durationMs > 0
      ? allBeforeStart.filter((m) => m.periodMs >= startMs - durationMs)
      : [];
  const priorMatches =
    equalDurationPrior.length > 0 ? equalDurationPrior : allBeforeStart;

  const windowSize = Math.max(1, rollingWindow);
  const points: MatchPoint[] = validMatches.map((match, idx, arr) => {
    const slice = arr.slice(Math.max(0, idx - windowSize + 1), idx + 1);
    const sumKills = slice.reduce((acc, m) => acc + m.kills, 0);
    const sumDeaths = slice.reduce((acc, m) => acc + m.deaths, 0);
    const sumAssists = slice.reduce((acc, m) => acc + m.assists, 0);
    const sumWins = slice.reduce((acc, m) => acc + (m.won ? 1 : 0), 0);

    // Pooled numerator/denominator prevents zero-death outlier matches from distorting the rolling ratio
    const rollingKd = calculateRatio(sumKills, sumDeaths);
    const rollingKda = calculateRatio(sumKills + sumAssists, sumDeaths);
    const rollingWinPct = Math.round(
      calculatePercentage(sumWins, slice.length),
    );
    const rollingKills = calculateRatio(sumKills, slice.length);
    const rollingDeaths = calculateRatio(sumDeaths, slice.length);
    const rollingAssists = calculateRatio(sumAssists, slice.length);

    const kds = slice.map((m) => m.kd);
    const kdas = slice.map((m) => m.kda);
    const killCounts = slice.map((m) => m.kills);

    const matchNumber = idx + 1;
    const dateShort = format(match.period, 'MMM d');
    const dateFull = format(match.period, 'MMM d, yyyy h:mm a');

    return {
      matchIndex: matchNumber,
      activityId: match.activityId,
      time: match.period.toISOString(),
      shortLabel: `#${matchNumber} · ${dateShort}`,
      fullLabel: `Match #${matchNumber} · ${match.location} · ${dateFull}`,
      location: match.location,
      kills: match.kills,
      deaths: match.deaths,
      assists: match.assists,
      won: match.won,
      kd: match.kd,
      kda: match.kda,
      winPct: match.won ? 100 : 0,
      rollingKd,
      rollingKda,
      rollingWinPct,
      rollingKills,
      rollingDeaths,
      rollingAssists,
      kdBand: [Math.min(...kds), Math.max(...kds)],
      kdaBand: [Math.min(...kdas), Math.max(...kdas)],
      killsBand: [Math.min(...killCounts), Math.max(...killCounts)],
    };
  });

  return {
    points,
    summary: summarizeMatchSamples(validMatches, priorMatches),
  };
}

export function generateMapTelemetry(
  matches: readonly TelemetryMatch[],
  time: CustomTimeWindow,
  filterBy?: GameMode,
  snapshots?: Record<string, TelemetrySnapshotSummary>,
): MapTelemetryResult[] {
  const filteredMatches = sortMatches(time, matches, filterBy);
  const mapTotals: Record<string, KDA> = {};
  const perMapSnapshotTotals: Record<string, Record<string, KDA>> = {};

  for (const match of filteredMatches) {
    const location = match.location;
    if (!location) {
      continue;
    }
    const { kills, deaths, assists } = match;
    const win = match.won ? 1 : 0;

    if (!mapTotals[location]) {
      mapTotals[location] = { kills, deaths, assists, wins: win, gameCount: 1 };
    } else {
      mapTotals[location].kills += kills;
      mapTotals[location].deaths += deaths;
      mapTotals[location].assists += assists;
      mapTotals[location].wins += win;
      mapTotals[location].gameCount += 1;
    }

    if (snapshots) {
      const snapId = match.snapshotId;
      const isValidLink =
        Boolean(snapId) &&
        Boolean(snapId && snapshots[snapId]) &&
        match.snapshotConfidence !== 'noMatch' &&
        match.snapshotConfidence !== 'notFound';

      if (isValidLink && snapId) {
        if (!perMapSnapshotTotals[location]) {
          perMapSnapshotTotals[location] = {};
        }
        if (!perMapSnapshotTotals[location][snapId]) {
          perMapSnapshotTotals[location][snapId] = {
            kills,
            deaths,
            assists,
            wins: win,
            gameCount: 1,
          };
        } else {
          perMapSnapshotTotals[location][snapId].kills += kills;
          perMapSnapshotTotals[location][snapId].deaths += deaths;
          perMapSnapshotTotals[location][snapId].assists += assists;
          perMapSnapshotTotals[location][snapId].wins += win;
          perMapSnapshotTotals[location][snapId].gameCount += 1;
        }
      }
    }
  }

  return Object.entries(mapTotals).map(([location, value]) => {
    const kd = calculateRatio(value.kills, value.deaths);
    const kda = calculateRatio(value.kills + value.assists, value.deaths);
    const winRatio = calculateRatio(value.wins, value.gameCount);
    const winPct = Math.round(calculatePercentage(value.wins, value.gameCount));

    let bestLoadout: MapBestLoadout | undefined;
    if (snapshots && perMapSnapshotTotals[location]) {
      const candidates = Object.entries(perMapSnapshotTotals[location]).map(
        ([snapshotId, stats]) => {
          const snapKd = calculateRatio(stats.kills, stats.deaths);
          const snapWinPct = Math.round(
            calculatePercentage(stats.wins, stats.gameCount),
          );
          return {
            snapshotId,
            name: snapshots[snapshotId]?.name || 'Loadout',
            kd: snapKd,
            winPct: snapWinPct,
            count: stats.gameCount,
          };
        },
      );

      // Prefer builds with 2+ matches on the map when available so a 1-game fluke doesn't overshadow a proven build
      const multiMatchCandidates = candidates.filter((c) => c.count >= 2);
      const pool =
        multiMatchCandidates.length > 0 ? multiMatchCandidates : candidates;

      pool.sort((a, b) => {
        if (b.kd !== a.kd) return b.kd - a.kd;
        if (b.winPct !== a.winPct) return b.winPct - a.winPct;
        return b.count - a.count;
      });

      if (pool[0]) {
        bestLoadout = pool[0];
      }
    }

    return {
      location,
      avgKills: calculateRatio(value.kills, value.gameCount),
      avgDeaths: calculateRatio(value.deaths, value.gameCount),
      avgAssists: calculateRatio(value.assists, value.gameCount),
      kd,
      kda,
      wins: value.wins,
      loses: value.gameCount - value.wins,
      winRatio,
      winPct,
      count: value.gameCount,
      signal: classifyMapSignal(value.gameCount, kd, winPct),
      bestLoadout,
    };
  });
}

function matchesGameMode(match: TelemetryMatch, filterBy?: GameMode): boolean {
  if (filterBy === undefined || filterBy === 'allGameModes') {
    return true;
  }
  return match.estimatedGameMode === filterBy;
}

function sortMatches(
  time: CustomTimeWindow,
  matches: readonly TelemetryMatch[],
  filterBy?: GameMode,
): TelemetryMatch[] {
  const startMs = new Date(time.start).getTime();
  const endMs = new Date(time.end).getTime();

  return matches
    .filter((m) => {
      if (!matchesGameMode(m, filterBy)) {
        return false;
      }
      const periodMs = new Date(m.period).getTime();
      return periodMs >= startMs && periodMs <= endMs;
    })
    .sort((a, b) => {
      return new Date(a.period).getTime() - new Date(b.period).getTime();
    });
}
