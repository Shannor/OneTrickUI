import React, { useMemo, useState } from 'react';
import { data } from 'react-router';
import { type GameMode, getSnapshotAggregates } from '~/api';
import { AvgPerformance } from '~/charts/AvgPerformance';
import { ChartHeader } from '~/charts/ChartHeader';
import { KDPerformance } from '~/charts/KDPerformance';
import { MapCount } from '~/charts/MapCount';
import { MapPerformance } from '~/charts/MapPerformance';
import { FormLabel } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { generateKDAResultsForTimeWindow, generatePerformancePerMap, type TimeWindow } from '~/lib/metrics';

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

  const [time, setTime] = useState<TimeWindow>('one-day');
  const [gameMode, setGameMode] = useState<GameMode>('allGameModes');

  const data = useMemo(() => {
    return generateKDAResultsForTimeWindow(
      aggregates,
      time,
      characterId,
      gameMode,
    );
  }, [aggregates, time, gameMode]);

  const mapData = useMemo(() => {
    return generatePerformancePerMap(aggregates, time, characterId, gameMode);
  }, [aggregates, time, gameMode]);

  return (
    <div className="flex flex-col gap-4">
      <title>Snapshot Metrics</title>
      <meta property="og:title" content="Snapshot Metrics" />
      <meta
        name="description"
        content="Analyze your Destiny 2 performance over time and by map/mode."
      />
      <div className="flex flex-col gap-4">
        <RadioGroup
          className="flex items-center gap-4"
          name="time-window"
          value={time}
          onValueChange={(value) => {
            setTime(value as TimeWindow);
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
        </RadioGroup>
        <RadioGroup
          className="flex items-center gap-4"
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
        <div className="flex flex-row gap-4">
          <ChartHeader
            title="Average Performance"
            description="Shows the average kills/deaths/assists for the selected time window."
          >
            <AvgPerformance
              data={data}
              timeWindow={time}
              syncId="performance"
            />
          </ChartHeader>

          <ChartHeader
            title="K/D & Efficiency"
            description="Shows the ratios for the selected time window."
          >
            <KDPerformance data={data} timeWindow={time} syncId="performance" />
          </ChartHeader>
        </div>
        <ChartHeader title="Map Performance">
          <MapPerformance data={mapData} timeWindow={time} syncId="map" />
        </ChartHeader>
        <ChartHeader title="Map Count">
          <MapCount data={mapData} timeWindow={time} syncId="map" />
        </ChartHeader>
      </div>
    </div>
  );
}
