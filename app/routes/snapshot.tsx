import {
  eachDayOfInterval,
  endOfToday,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfToday,
  subMonths,
  subWeeks,
} from 'date-fns';
import React, { useMemo, useState } from 'react';
import { data } from 'react-router';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { type Aggregate, getSnapshot, getSnapshotAggregates } from '~/api';
import { calculateRatio } from '~/calculations/precision';
import { Class } from '~/components/class';
import { Loadout } from '~/components/loadout';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart';
import { FormLabel } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';

import type { Route } from './+types/snapshot';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { snapshotId } = params;
  const { data: snapshot, error } = await getSnapshot({
    path: { snapshotId },
  });
  if (error) {
    console.error(error);
    throw data('Unexpected Error', { status: 500 });
  }
  if (!snapshot) {
    throw data('Record Not Found', { status: 404 });
  }
  const { data: aggs, error: error2 } = await getSnapshotAggregates({
    path: { snapshotId },
  });
  if (error2) {
    console.error(error);
    throw data(undefined, { status: 404 });
  }
  if (!aggs) {
    throw data('Record Not Found', { status: 404 });
  }

  return {
    snapshot,
    aggregates: aggs,
  };
}

const chartConfig = {
  kills: {
    label: 'Kills',
    color: 'var(--chart-1)',
  },
  deaths: {
    label: 'Deaths',
    color: 'var(--chart-2)',
  },
  assists: {
    label: 'Assists',
    color: 'var(--chart-3)',
  },
  kda: {
    label: 'K+A/D',
    color: 'var(--chart-4)',
  },
  kd: {
    label: 'K/D',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

export default function Snapshot({ loaderData }: Route.ComponentProps) {
  const { snapshot, aggregates } = loaderData;

  const [time, setTime] = useState('one-day');

  const data = useMemo(() => {
    return getData(aggregates, time, snapshot.characterId);
  }, [aggregates, time, snapshot.characterId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {snapshot.id}
          </h2>
          <p>
            Snapshots are equipped loadouts that your character was wearing at
            the time.
          </p>
        </div>
      </div>
      <RadioGroup
        className="flex items-center gap-4"
        name="time-window"
        value={time}
        onValueChange={(value) => {
          setTime(value);
        }}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="one-day" id="one-day" />
          <FormLabel htmlFor="one-day">1 Day</FormLabel>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="one-week" id="one-week" />
          <FormLabel htmlFor="one-week">1 Week</FormLabel>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="one-month" id="one-month" />
          <FormLabel htmlFor="one-month">1 Month</FormLabel>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="six-months" id="six-months" />
          <FormLabel htmlFor="six-months">6 Month</FormLabel>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all-time" id="all-time" />
          <FormLabel htmlFor="all-time">All Time</FormLabel>
        </div>
      </RadioGroup>
      <ChartContainer
        config={chartConfig}
        className="max-h-[400px] min-h-[400px] w-full"
      >
        <LineChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Line
            dataKey="avgKills"
            type="monotone"
            stroke="var(--color-kills)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="avgAssists"
            type="monotone"
            stroke="var(--color-assists)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="avgDeaths"
            type="monotone"
            stroke="var(--color-deaths)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
      <ChartContainer
        config={chartConfig}
        className="max-h-[400px] min-h-[400px] w-full"
      >
        <LineChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Line
            dataKey="kd"
            type="monotone"
            stroke="var(--color-kd)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="kda"
            type="monotone"
            stroke="var(--color-kda)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
      <div>
        <Class snapshot={snapshot} />
        <Loadout snapshot={snapshot} />
      </div>
    </div>
  );
}
interface KDA {
  kills: number;
  deaths: number;
  assists: number;
  gameCount: number;
}
interface KDAChartData {
  time: string;
  KD: number;
  KDA: number;
}
function getData(aggs: Aggregate[], time: string, characterId: string) {
  const endDay = endOfToday();
  // Step 1 - Generate Intervals based on the time window
  // Step 2 - Group by interval
  // Step 3 - Sum up values for each interval
  // Step 4 - Sort by interval
  switch (time) {
    case 'one-day': {
      // Hours Intervals
      const startDay = startOfToday();
      const values = aggs.filter(
        (a) =>
          isAfter(a.activityDetails.period, startDay) &&
          isBefore(a.activityDetails.period, endDay),
      );
      return values
        .map((agg) => {
          const p = agg.performance[characterId];
          if (!p) {
            return null;
          }
          // Group by 15-minute intervals
          return {
            time: agg.activityDetails.period,
            kills: p.playerStats.kills?.value ?? 0,
            deaths: p.playerStats.deaths?.value ?? 0,
            assists: p.playerStats.assists?.value ?? 0,
          };
        })
        .filter(Boolean);
    }
    case 'one-week': {
      const startDay = subWeeks(startOfToday(), 1);
      const intervals = eachDayOfInterval({
        start: startDay,
        end: endDay,
      });
      const values = aggs
        .filter(
          (a) =>
            isAfter(a.activityDetails.period, startDay) &&
            isBefore(a.activityDetails.period, endDay),
        )
        .sort((a, b) => {
          return (
            new Date(a.activityDetails.period).getTime() -
            new Date(b.activityDetails.period).getTime()
          );
        })
        .reduce<Record<string, KDA>>((acc, agg) => {
          const day = startOfDay(new Date(agg.activityDetails.period));
          const p = agg.performance[characterId];
          if (!p) {
            // Maybe need to remove this
            return acc;
          }
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
          const day = interval.toISOString();
          const dayAggs = values[day];
          if (!dayAggs) {
            return {
              time: day,
              kills: 0,
              deaths: 0,
              assists: 0,
              avgKills: 0,
              avgDeaths: 0,
              avgAssists: 0,
              kd: 0,
              kda: 0,
            };
          }
          return {
            time: day,
            kills: dayAggs.kills ?? 0,
            deaths: dayAggs.deaths ?? 0,
            assists: dayAggs.assists ?? 0,
            avgKills: calculateRatio(dayAggs.kills, dayAggs.gameCount),
            avgDeaths: calculateRatio(dayAggs.deaths, dayAggs.gameCount),
            avgAssists: calculateRatio(dayAggs.assists, dayAggs.gameCount),
            kd: calculateRatio(dayAggs.kills, dayAggs.deaths),
            kda: calculateRatio(
              dayAggs.kills + dayAggs.assists,
              dayAggs.deaths,
            ),
          };
        })
        .filter(Boolean);
    }
    case 'one-month': {
      const startDay = subMonths(startOfToday(), 1);
      const intervals = eachDayOfInterval({
        start: startDay,
        end: endDay,
      });
      const values = aggs
        .filter(
          (a) =>
            isAfter(a.activityDetails.period, startDay) &&
            isBefore(a.activityDetails.period, endDay),
        )
        .sort((a, b) => {
          return (
            new Date(a.activityDetails.period).getTime() -
            new Date(b.activityDetails.period).getTime()
          );
        })
        .reduce<Record<string, KDA>>((acc, agg) => {
          const day = startOfDay(new Date(agg.activityDetails.period));
          const p = agg.performance[characterId];
          if (!p) {
            // Maybe need to remove this
            return acc;
          }
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
          const day = interval.toISOString();
          const dayAggs = values[day];
          if (!dayAggs) {
            return {
              time: day,
              kills: 0,
              deaths: 0,
              assists: 0,
              avgKills: 0,
              avgDeaths: 0,
              avgAssists: 0,
              kd: 0,
              kda: 0,
            };
          }
          return {
            time: day,
            kills: dayAggs.kills ?? 0,
            deaths: dayAggs.deaths ?? 0,
            assists: dayAggs.assists ?? 0,
            avgKills: calculateRatio(dayAggs.kills, dayAggs.gameCount),
            avgDeaths: calculateRatio(dayAggs.deaths, dayAggs.gameCount),
            avgAssists: calculateRatio(dayAggs.assists, dayAggs.gameCount),
            kd: calculateRatio(dayAggs.kills, dayAggs.deaths),
            kda: calculateRatio(
              dayAggs.kills + dayAggs.assists,
              dayAggs.deaths,
            ),
          };
        })
        .filter(Boolean);
    }
    default:
      return aggs.map((agg) => {
        const p = agg.performance[characterId];
        if (!p) {
          return null;
        }
        // Group by Months
        return {
          time: agg.activityDetails.period,
          kills: p.playerStats.kills?.value ?? 0,
          deaths: p.playerStats.deaths?.value ?? 0,
          assists: p.playerStats.assists?.value ?? 0,
        };
      });
  }
}
