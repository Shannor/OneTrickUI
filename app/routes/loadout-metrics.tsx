import React, { useMemo, useState } from 'react';
import { data } from 'react-router';
import { type GameMode, getSnapshotAggregates } from '~/api';
import { calculatePercentage, calculateRatio } from '~/calculations/precision';
import { AvgPerformance } from '~/charts/AvgPerformance';
import { ChartWrapper } from '~/charts/ChartWrapper';
import { KDPerformance } from '~/charts/KDPerformance';
import { MapCount } from '~/charts/MapCount';
import { MapPerformance } from '~/charts/MapPerformance';
import { WinRatio } from '~/charts/WinRatio';
import { CardTitle } from '~/components/ui/card';
import { DateRangePicker } from '~/components/ui/date-range-picker';
import { FormLabel } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { useLoadoutData } from '~/hooks/use-route-loaders';
import {
  type CustomTimeWindow,
  type TimeWindow,
  generateKDAResultsForTimeWindow,
  generatePerformancePerMap,
  timeWindowToCustom,
} from '~/lib/metrics';
import { cn } from '~/lib/utils';

import type { Route } from './+types/loadout-metrics';

export async function loader({ params }: Route.LoaderArgs) {
  const { snapshotId } = params;
  const { data: aggregates, error } = await getSnapshotAggregates({
    path: { snapshotId },
  });
  if (error) {
    console.error(error);
    throw data(undefined, { status: 404 });
  }
  if (!aggregates) {
    throw data('Record Not Found', { status: 404 });
  }

  return {
    aggregates,
  };
}

export default function LoadoutMetrics({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { aggregates } = loaderData;
  const { characterId } = params;
  const { snapshot } = useLoadoutData();

  const [time, setTime] = useState<TimeWindow | CustomTimeWindow>('all-time');
  const [gameMode, setGameMode] = useState<GameMode>('allGameModes');

  const customTime = useMemo(() => {
    const allTimeStartDate = snapshot
      ? new Date(snapshot.createdAt)
      : undefined;
    return timeWindowToCustom(time, aggregates, allTimeStartDate);
  }, [time, snapshot, aggregates]);

  const data = useMemo(() => {
    return generateKDAResultsForTimeWindow(
      aggregates,
      customTime,
      characterId,
      gameMode,
    );
  }, [aggregates, customTime, gameMode, characterId]);

  const mapData = useMemo(() => {
    return generatePerformancePerMap(
      aggregates,
      customTime,
      characterId,
      gameMode,
    );
  }, [aggregates, customTime, gameMode, characterId]);

  const ratio = data.reduce(
    (state, current) => {
      state.wins += current.wins;
      state.games += current.gameCount;
      return state;
    },
    { wins: 0, games: 0 },
  );
  return (
    <div className="flex flex-col gap-4">
      <title>Snapshot Metrics</title>
      <meta property="og:title" content="Snapshot Metrics" />
      <meta
        name="description"
        content="Analyze your Destiny 2 performance over time and by map/mode."
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <DateRangePicker value={time} onValueChange={setTime} />
          <RadioGroup
            className="flex flex-col items-start gap-4 lg:flex-row lg:items-center"
            name="game-mode"
            value={gameMode}
            onValueChange={(value) => {
              setGameMode(value as GameMode);
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="allGameModes" id="all" />
              <FormLabel htmlFor="one">All</FormLabel>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quickplay" id="quickplay" />
              <FormLabel htmlFor="quickplay">Quickplay</FormLabel>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="competitive" id="comp" />
              <FormLabel htmlFor="comp">Competitive</FormLabel>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="trials" id="trials" />
              <FormLabel htmlFor="trials">Trials</FormLabel>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ironBanner" id="ib" />
              <FormLabel htmlFor="ib">Iron Banner</FormLabel>
            </div>
          </RadioGroup>
        </div>
        <div className="flex flex-col gap-4 xl:flex-row">
          <ChartWrapper
            title="Average Performance"
            description="Shows the average kills/deaths/assists for the selected time window."
          >
            <AvgPerformance
              data={data}
              timeWindow={customTime}
              syncId="performance"
              className="lg:max-h-[200px] xl:max-h-[400px]"
            />
          </ChartWrapper>

          <ChartWrapper
            title="K/D & Efficiency"
            description="Shows the ratios for the selected time window."
          >
            <KDPerformance
              data={data}
              timeWindow={customTime}
              syncId="performance"
              className="lg:max-h-[200px] xl:max-h-[400px]"
            />
          </ChartWrapper>
          <ChartWrapper
            title={
              <div className="flex flex-row gap-4">
                <CardTitle>Win Ratio</CardTitle>
                <div
                  className={cn(
                    'text-md',
                    calculateRatio(ratio.wins, ratio.games) >= 0.5
                      ? 'text-green-500'
                      : 'text-red-500',
                  )}
                >{`${calculatePercentage(ratio.wins, ratio.games)}%`}</div>
              </div>
            }
            description="Shows the win ratio for the selected time window."
          >
            <WinRatio
              data={data}
              timeWindow={customTime}
              syncId="performance"
              className="lg:max-h-[200px] xl:max-h-[400px]"
            />
          </ChartWrapper>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <ChartWrapper
            title="Map Performance"
            description="Shows the map performance for the selected time window."
          >
            <MapPerformance
              data={mapData}
              timeWindow={customTime}
              syncId="map"
            />
          </ChartWrapper>
          <ChartWrapper
            title="Map Distrubtion"
            description="Shows the number of games played for each map."
          >
            <MapCount data={mapData} timeWindow={customTime} syncId="map" />
          </ChartWrapper>
        </div>
      </div>
    </div>
  );
}
