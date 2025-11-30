import {
  addMinutes,
  differenceInDays,
  eachDayOfInterval,
  eachHourOfInterval,
  eachMinuteOfInterval,
  eachMonthOfInterval,
  endOfHour,
  endOfToday,
  format,
  isAfter,
  isBefore,
  isFirstDayOfMonth,
  isLastDayOfMonth,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfToday,
  subHours,
  subMinutes,
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
  wins: number;
}

export interface KDAResult {
  time: string;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kd: number;
  kda: number;
  winRatio: number;
  wins: number;
  gameCount: number;
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

export function timeWindowToCustom(
  time: TimeWindow | CustomTimeWindow,
  aggregates: Aggregate[],
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
      const items = [...aggregates].sort(
        (a, b) =>
          new Date(b.activityDetails.period).getTime() -
          new Date(a.activityDetails.period).getTime(),
      );
      const last = items[0];
      const first = items[items.length - 1];
      const endDate = last ? new Date(last.activityDetails.period) : end;
      const start = new Date(first.activityDetails.period);
      return { start: subMinutes(start, 30), end: addMinutes(endDate, 30) };
    }
  }
}

export function generatePerformancePerMap(
  aggregates: Aggregate[],
  time: CustomTimeWindow,
  characterId: string,
  filterBy?: GameMode,
): MapResult[] {
  const aggs = sortAggregates(time, aggregates, filterBy);
  const values = aggs.reduce<Record<string, KDA>>((acc, agg) => {
    const p = agg.performance[characterId];
    const location = agg.activityDetails.location;
    if (!p) {
      return acc;
    }
    if (!acc[location]) {
      acc[location] = {
        kills: p.playerStats.kills?.value ?? 0,
        deaths: p.playerStats.deaths?.value ?? 0,
        assists: p.playerStats.assists?.value ?? 0,
        wins: p.playerStats.standing?.value === 0 ? 1 : 0,
        gameCount: 1,
      };
    } else {
      acc[location].kills += p.playerStats.kills?.value ?? 0;
      acc[location].deaths += p.playerStats.deaths?.value ?? 0;
      acc[location].assists += p.playerStats.assists?.value ?? 0;
      acc[location].wins += p.playerStats.standing?.value === 0 ? 1 : 0;
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
      winRatio: calculateRatio(value.wins, value.gameCount),
      count: value.gameCount,
    };
  });
}

export function generateKDAResultsForTimeWindow(
  aggregates: Aggregate[],
  time: CustomTimeWindow,
  characterId: string,
  filterBy?: GameMode,
): KDAResult[] {
  const { intervals, intervalRate } = getTimes(time);
  console.log('in function', time, aggregates, intervalRate, intervals);
  const aggs = sortAggregates(time, aggregates, filterBy);
  console.log(aggs, 'length', aggs.length);
  const values = aggs.reduce<Record<string, KDA>>((acc, agg) => {
    const p = agg.performance[characterId];
    if (!p) {
      return acc;
    }
    let day: Date;
    switch (intervalRate) {
      case 'minute': {
        const d = new Date(agg.activityDetails.period);
        const minutes = d.getMinutes();
        const roundedMinutes = Math.floor(minutes / 15) * 15;
        d.setMinutes(roundedMinutes, 0, 0);
        day = d;
        break;
      }
      case 'hour': {
        day = startOfHour(new Date(agg.activityDetails.period));
        break;
      }
      case 'day':
        day = startOfDay(new Date(agg.activityDetails.period));
        break;
      case 'month': {
        day = startOfMonth(new Date(agg.activityDetails.period));
        break;
      }
    }
    if (!acc[day.toISOString()]) {
      acc[day.toISOString()] = {
        kills: p.playerStats.kills?.value ?? 0,
        deaths: p.playerStats.deaths?.value ?? 0,
        assists: p.playerStats.assists?.value ?? 0,
        wins: p.playerStats.standing?.value === 0 ? 1 : 0,
        gameCount: 1,
      };
    } else {
      acc[day.toISOString()].kills += p.playerStats.kills?.value ?? 0;
      acc[day.toISOString()].deaths += p.playerStats.deaths?.value ?? 0;
      acc[day.toISOString()].assists += p.playerStats.assists?.value ?? 0;
      acc[day.toISOString()].wins +=
        p.playerStats.standing?.value === 0 ? 1 : 0;
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
          winRatio: 0.5,
          wins: 0,
          gameCount: 0,
        };
      }
      return {
        time: int,
        avgKills: calculateRatio(value.kills, value.gameCount),
        avgDeaths: calculateRatio(value.deaths, value.gameCount),
        avgAssists: calculateRatio(value.assists, value.gameCount),
        kd: calculateRatio(value.kills, value.deaths),
        kda: calculateRatio(value.kills + value.assists, value.deaths),
        winRatio: calculateRatio(value.wins, value.gameCount),
        gameCount: value.gameCount,
        wins: value.wins,
      };
    })
    .filter(Boolean);
}
function getTimes(time: CustomTimeWindow): {
  intervals: Date[];
  startDay: Date;
  endDay: Date;
  intervalRate: 'minute' | 'hour' | 'day' | 'month';
} {
  let intervalRate: 'minute' | 'hour' | 'day' | 'month' = 'hour';
  const start = new Date(time.start);
  const end = new Date(time.end);
  const dayDifference = differenceInDays(end, start);

  let intervals: Date[];
  if (dayDifference < 1) {
    intervals = eachMinuteOfInterval(
      { start: startOfHour(start), end: endOfHour(end) },
      { step: 15 },
    );
    intervalRate = 'minute';
  } else if (dayDifference <= 2) {
    intervals = eachHourOfInterval({ start, end });
    intervalRate = 'hour';
  } else if (dayDifference <= 31) {
    intervals = eachDayOfInterval({ start, end });
    intervalRate = 'day';
  } else {
    intervals = eachMonthOfInterval({ start, end });
    intervalRate = 'month';
  }

  return {
    intervals,
    startDay: start,
    endDay: end,
    intervalRate,
  };
}

function sortAggregates(
  time: CustomTimeWindow,
  aggregates: Aggregate[],
  filterBy?: GameMode,
) {
  const { endDay, startDay } = getTimes(time);
  return aggregates
    .filter((a) => {
      if (filterBy !== undefined && filterBy !== 'allGameModes') {
        const modes = gameModeToActivityModes(filterBy);
        if (modes) {
          if (!modes.includes(a.activityDetails.activity)) {
            return false;
          }
        }
      }
      return (
        isAfter(new Date(a.activityDetails.period), startDay) &&
        isBefore(new Date(a.activityDetails.period), endDay)
      );
    })
    .sort((a, b) => {
      return (
        new Date(a.activityDetails.period).getTime() -
        new Date(b.activityDetails.period).getTime()
      );
    });
}
export function tickFormater(
  value: string,
  timeWindow: CustomTimeWindow,
): string {
  let rate: 'minute' | 'hour' | 'day' | 'month' = 'day';

  const dayDifference = differenceInDays(timeWindow.end, timeWindow.start);
  if (dayDifference < 1) {
    rate = 'minute';
  } else if (dayDifference <= 2) {
    rate = 'hour';
  } else if (dayDifference <= 31) {
    rate = 'day';
  } else {
    rate = 'month';
  }

  switch (rate) {
    case 'minute':
      return format(new Date(value), 'h:mm aa');
    case 'hour':
      return format(new Date(value), 'h aa');
    case 'day':
      if (
        isFirstDayOfMonth(new Date(value)) ||
        isLastDayOfMonth(new Date(value))
      ) {
        return format(new Date(value), 'MMM d');
      }
      return format(new Date(value), 'd');
    case 'month':
      return format(new Date(value), 'MMM');
    default:
      return value;
  }
}

export function labelFormater(
  value: string,
  timeWindow: CustomTimeWindow,
): string {
  let rate: 'minute' | 'hour' | 'day' | 'month' = 'day';

  const dayDifference = differenceInDays(timeWindow.end, timeWindow.start);
  if (dayDifference < 1) {
    rate = 'minute';
  } else if (dayDifference <= 2) {
    rate = 'hour';
  } else if (dayDifference <= 31) {
    rate = 'day';
  } else {
    rate = 'month';
  }

  switch (rate) {
    case 'minute':
      return format(new Date(value), 'h:mm aa');
    case 'hour':
      return format(new Date(value), 'h aa');
    case 'day':
      return format(new Date(value), 'EEEE');
    case 'month':
      return format(new Date(value), 'MMMM do');
    default:
      return value;
  }
}

function gameModeToActivityModes(gameMode: GameMode): string[] | null {
  switch (gameMode) {
    case 'allGameModes':
      return null;
    case 'competitive':
      return ['Competitive: Matchmade', 'Competitive'];
    case 'quickplay':
      return [
        'Control Quickplay',
        'Control',
        'Control: Matchmade',
        'Clash',
        'Clash Quickplay',
      ];
    case 'ironBanner':
      return [
        'Iron Banner Zone:Control',
        'Iron Banner:Control',
        'Iron Banner',
        'Iron Banner:Supremacy',
        'Iron Banner:Rift',
        'Iron Banner:Clash',
      ];
    case 'trials':
      return ['Trials of Osiris', 'Trials of Osiris: Matchmade'];
    default:
      return null;
  }
}
