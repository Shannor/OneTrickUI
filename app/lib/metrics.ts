import {
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  endOfToday,
  format,
  isAfter,
  isBefore,
  isFirstDayOfMonth,
  isLastDayOfMonth,
  startOfDay,
  startOfToday,
  subMonths,
  subWeeks,
} from 'date-fns';
import type { Aggregate, GameMode } from '~/api';
import { calculateRatio } from '~/calculations/precision';

interface KDA {
  kills: number;
  deaths: number;
  assists: number;
  gameCount: number;
}
export interface KDAResult {
  time: string;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kd: number;
  kda: number;
}
export interface MapResult {
  location: string;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kd: number;
  kda: number;
  count: number;
}
export type TimeWindow = 'one-day' | 'one-week' | 'one-month' | 'six-months';

export function generatePerformancePerMap(
  aggregates: Aggregate[],
  time: TimeWindow,
  characterId: string,
  filterBy?: GameMode,
): MapResult[] {
  const aggs = sortAggregates(time, aggregates, filterBy);
  const values = aggs.reduce<Record<string, KDA>>((acc, agg) => {
    const p = agg.performance[characterId];
    const location = agg.activityDetails.location;
    if (!p) {
      // Maybe need to remove this
      return acc;
    }
    if (!acc[location]) {
      acc[location] = {
        kills: p.playerStats.kills?.value ?? 0,
        deaths: p.playerStats.deaths?.value ?? 0,
        assists: p.playerStats.assists?.value ?? 0,
        gameCount: 1,
      };
    } else {
      acc[location].kills += p.playerStats.kills?.value ?? 0;
      acc[location].deaths += p.playerStats.deaths?.value ?? 0;
      acc[location].assists += p.playerStats.assists?.value ?? 0;
      acc[location].gameCount += 1;
    }
    return acc;
  }, {});
  return Object.entries(values).map(([location, value]) => {
    return {
      location,
      avgKills: calculateRatio(value.kills, value.gameCount),
      avgDeaths: calculateRatio(value.deaths, value.gameCount),
      avgAssists: calculateRatio(value.assists, value.gameCount),
      kd: calculateRatio(value.kills, value.deaths),
      kda: calculateRatio(value.kills + value.assists, value.deaths),
      count: value.gameCount,
    };
  });
}

export function generateKDAResultsForTimeWindow(
  aggregates: Aggregate[],
  time: TimeWindow,
  characterId: string,
  filterBy?: GameMode,
): KDAResult[] {
  const { intervals } = getTimes(time);
  const aggs = sortAggregates(time, aggregates, filterBy);
  const values = aggs.reduce<Record<string, KDA>>((acc, agg) => {
    const p = agg.performance[characterId];
    if (!p) {
      // Maybe need to remove this
      return acc;
    }
    const day = startOfDay(new Date(agg.activityDetails.period));
    if (!acc[day.toISOString()]) {
      acc[day.toISOString()] = {
        kills: p.playerStats.kills?.value ?? 0,
        deaths: p.playerStats.deaths?.value ?? 0,
        assists: p.playerStats.assists?.value ?? 0,
        gameCount: 1,
      };
    } else {
      acc[day.toISOString()].kills += p.playerStats.kills?.value ?? 0;
      acc[day.toISOString()].deaths += p.playerStats.deaths?.value ?? 0;
      acc[day.toISOString()].assists += p.playerStats.assists?.value ?? 0;
      acc[day.toISOString()].gameCount += 1;
    }
    return acc;
  }, {});

  return intervals
    .map((interval) => {
      const int = interval.toISOString();
      const value = values[int];
      if (!value) {
        return {
          time: int,
          avgKills: 0,
          avgDeaths: 0,
          avgAssists: 0,
          kd: 1.0,
          kda: 1.0,
        };
      }
      return {
        time: int,
        avgKills: calculateRatio(value.kills, value.gameCount),
        avgDeaths: calculateRatio(value.deaths, value.gameCount),
        avgAssists: calculateRatio(value.assists, value.gameCount),
        kd: calculateRatio(value.kills, value.deaths),
        kda: calculateRatio(value.kills + value.assists, value.deaths),
      };
    })
    .filter(Boolean);
}
function getTimes(time: TimeWindow): {
  intervals: Date[];
  startDay: Date;
  endDay: Date;
} {
  const endDay = endOfToday();
  let startDay: Date;
  let intervals: Date[];
  switch (time) {
    case 'one-day': {
      startDay = startOfToday();
      intervals = eachHourOfInterval({
        start: startOfToday(),
        end: endDay,
      });
      break;
    }
    case 'one-week': {
      startDay = subWeeks(startOfToday(), 1);
      intervals = eachDayOfInterval({
        start: subWeeks(startOfToday(), 1),
        end: endDay,
      });
      break;
    }
    case 'one-month': {
      startDay = subMonths(startOfToday(), 1);
      intervals = eachDayOfInterval({
        start: subMonths(startOfToday(), 1),
        end: endDay,
      });
      break;
    }
    case 'six-months': {
      startDay = subMonths(startOfToday(), 6);
      intervals = eachMonthOfInterval({
        start: subMonths(startOfToday(), 6),
        end: endDay,
      });
      break;
    }
    default:
      throw new Error('Invalid time window');
  }
  return { intervals, startDay, endDay };
}

function sortAggregates(
  time: TimeWindow,
  aggregates: Aggregate[],
  filterBy?: GameMode,
) {
  const { endDay, startDay } = getTimes(time);
  return (
    aggregates
      .filter((a) => {
        if (filterBy) {
          if (a.activityDetails.mode && a.activityDetails.mode !== filterBy) {
            const modes = gameModeToActivityModes(filterBy);
            if (modes) {
              if (!modes.includes(a.activityDetails.mode)) {
                return false;
              }
            }
          }
        }
        return (
          isAfter(a.activityDetails.period, startDay) &&
          isBefore(a.activityDetails.period, endDay)
        );
      })
      // May not need thi sorting
      .sort((a, b) => {
        return (
          new Date(a.activityDetails.period).getTime() -
          new Date(b.activityDetails.period).getTime()
        );
      })
  );
}
export function tickFormater(value: string, timeWindow: TimeWindow): string {
  switch (timeWindow) {
    case 'one-day':
      return format(new Date(value), 'h aa');
    case 'one-week':
      return format(new Date(value), 'EEE');
    case 'one-month': {
      if (
        isFirstDayOfMonth(new Date(value)) ||
        isLastDayOfMonth(new Date(value))
      ) {
        return format(new Date(value), 'MMM d');
      }
      return format(new Date(value), 'd');
    }
    case 'six-months':
      return format(new Date(value), 'MMM');
    default:
      return value;
  }
}

export function labelFormater(value: string, timeWindow: TimeWindow): string {
  switch (timeWindow) {
    case 'one-day':
      return format(new Date(value), 'h aa');
    case 'one-week':
      return format(new Date(value), 'EEEE');
    case 'one-month': {
      return format(new Date(value), 'MMMM do');
    }
    case 'six-months':
      return format(new Date(value), 'MMMM');
    default:
      return value;
  }
}

function gameModeToActivityModes(gameMode: GameMode): string[] | null {
  switch (gameMode) {
    case 'allGameModes':
      return null;
    case 'competitive':
      return [
        'Control Competitive',
        'Zone Control',
        'Survival',
        'Clash Competitive',
      ];
    case 'quickplay':
      return [
        'Control Quickplay',
        'Control',
        'Rift',
        'Clash',
        'Clash Quickplay',
      ];
    case 'ironBanner':
      return [
        'Iron Banner Zone Control',
        'Iron Banner Control',
        'Iron Banner',
        'Iron Banner Supremacy',
        'Iron Banner Rift',
        'Iron Banner Clash',
      ];
    case 'trials':
      return ['Trials of Osiris', 'Trials Survival', 'Trials Countdown'];
    default:
      return null;
  }
}
