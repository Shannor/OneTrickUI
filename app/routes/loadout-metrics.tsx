import { useMemo, useState } from 'react';
import { getRequestLogger } from '~/.server/logger';
import {
  type GameMode,
  type TelemetryMatch,
  getCharacterTelemetry,
} from '~/api';
import { MapTelemetryPanel } from '~/charts/map-telemetry';
import { MetricsTrendPanel } from '~/charts/metrics-trend';
import { Empty } from '~/components/empty';
import { MetricsFilterBar } from '~/components/metrics-filter-bar';
import { TelemetryTruncationNotice } from '~/components/telemetry-truncation-notice';
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
  const { id: userId, characterId, snapshotId } = params;
  log.set({
    route: 'routes/loadout-metrics',
    snapshot: { id: snapshotId, userId, characterId },
  });

  try {
    const { data, error } = await getCharacterTelemetry({
      path: { userId, characterId },
      query: { snapshotId },
    });

    if (error) {
      log.error('Failed to fetch loadout telemetry', {
        snapshot: { id: snapshotId, userId, characterId, error },
      });
      return {
        matches: [] as TelemetryMatch[],
        totalCount: 0,
        truncated: false,
        error: 'Failed to load loadout metrics',
      };
    }

    const matches = data?.matches ?? [];
    const totalCount = data?.totalCount ?? matches.length;
    const truncated = Boolean(data?.truncated);

    log.set({
      snapshot: {
        id: snapshotId,
        userId,
        characterId,
        matchCount: matches.length,
        totalCount,
        truncated,
      },
    });

    return {
      matches,
      totalCount,
      truncated,
      error: undefined,
    };
  } catch (err) {
    log.error(
      err instanceof Error ? err : 'Failed to fetch loadout telemetry',
      { snapshot: { id: snapshotId, userId, characterId } },
    );
    return {
      matches: [] as TelemetryMatch[],
      totalCount: 0,
      truncated: false,
      error: 'Failed to load loadout metrics',
    };
  }
}

export function LoadoutMetrics({ loaderData }: Route.ComponentProps) {
  const { matches, totalCount, truncated, error } = loaderData;
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
    return timeWindowToCustom(time, matches);
  }, [time, matches]);

  const matchSeries = useMemo(() => {
    return generateMatchSeries(matches, customTime, gameMode);
  }, [matches, customTime, gameMode]);

  const mapData = useMemo(() => {
    return generateMapTelemetry(matches, customTime, gameMode);
  }, [matches, customTime, gameMode]);

  if (error || matches.length === 0) {
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
      {truncated && (
        <TelemetryTruncationNotice
          shownCount={matches.length}
          totalCount={totalCount}
        />
      )}
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
