import { useMemo, useState } from 'react';
import { getRequestLogger } from '~/.server/logger';
import { type GameMode, getSnapshotAggregates } from '~/api';
import { MapTelemetryPanel } from '~/charts/MapTelemetryPanel';
import { MetricsTrendPanel } from '~/charts/MetricsTrendPanel';
import { Empty } from '~/components/empty';
import { MetricsFilterBar } from '~/components/metrics-filter-bar';
import {
  useLoadoutData,
  useOptionalProfileData,
} from '~/hooks/use-route-loaders';
import {
  type CustomTimeWindow,
  type TimeWindow,
  generateMapTelemetry,
  generateMatchSeries,
  timeWindowToCustom,
} from '~/lib/metrics';

import type { Route } from './+types/loadout-metrics';

export async function loader({ params, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { snapshotId } = params;
  log.set({ route: 'routes/loadout-metrics', snapshot: { id: snapshotId } });
  const { data: aggregates, error } = await getSnapshotAggregates({
    path: { snapshotId },
  });
  if (error) {
    log.error('Failed to fetch snapshot aggregates', {
      snapshot: { id: snapshotId, error },
    });
    return {
      aggregates: [],
      error: 'Failed to load snapshot aggregates',
    };
  }
  if (!aggregates) {
    log.set({ snapshot: { id: snapshotId, aggregateCount: 0 } });
    return {
      aggregates: [],
      error: undefined,
    };
  }

  log.set({ snapshot: { id: snapshotId, aggregateCount: aggregates.length } });
  return {
    aggregates,
    error: undefined,
  };
}

export function LoadoutMetrics({ loaderData, params }: Route.ComponentProps) {
  const { aggregates, error } = loaderData;
  const { characterId } = params;
  const { snapshot, path } = useLoadoutData();
  const { profile } = useOptionalProfileData() ?? {};

  const loadoutName = snapshot?.name || 'Loadout';
  const displayName = profile?.displayName;
  const pageTitle = displayName
    ? `${loadoutName} Metrics - ${displayName} | 1 Trick`
    : `${loadoutName} Metrics | 1 Trick`;
  const pageDescription =
    snapshot?.description ||
    `Analyze Destiny 2 performance over time and by map/mode for ${displayName ? `${displayName}'s ` : ''}${loadoutName} on 1 Trick.`;
  const canonicalUrl = path ? `${path}/metrics` : '';
  const origin = path ? new URL(path).origin : 'https://d2onetrick.com';
  const ogImageUrl = snapshot?.id
    ? `${origin}/og/loadout/${snapshot.id}.png`
    : `${origin}/og-image.png`;

  const metaTags = (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImageUrl} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </>
  );

  const [time, setTime] = useState<TimeWindow | CustomTimeWindow>('all-time');
  const [gameMode, setGameMode] = useState<GameMode>('allGameModes');

  const customTime = useMemo(() => {
    return timeWindowToCustom(time, aggregates);
  }, [time, aggregates]);

  const matchSeries = useMemo(() => {
    return generateMatchSeries(aggregates, customTime, characterId, gameMode);
  }, [aggregates, customTime, characterId, gameMode]);

  const mapData = useMemo(() => {
    return generateMapTelemetry(aggregates, customTime, characterId, gameMode);
  }, [aggregates, customTime, characterId, gameMode]);

  if (error || aggregates.length === 0) {
    return (
      <>
        {metaTags}
        <Empty
          title={error ? 'Unable to Load Metrics' : 'No Metrics Recorded Yet'}
          description={
            error
              ? 'We encountered an error loading performance metrics for this loadout.'
              : 'Play matches with this loadout to see performance metrics and charts!'
          }
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {metaTags}
      <MetricsFilterBar
        time={time}
        onTimeChange={setTime}
        gameMode={gameMode}
        onGameModeChange={setGameMode}
      />

      {matchSeries.points.length === 0 ? (
        <Empty
          title="No Matches in Selected Filter"
          description="Try expanding the date range or switching back to All Modes to view telemetry for this loadout."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <MetricsTrendPanel
            points={matchSeries.points}
            summary={matchSeries.summary}
            syncId="loadout-performance"
          />
          <MapTelemetryPanel data={mapData} />
        </div>
      )}
    </div>
  );
}

export default LoadoutMetrics;
