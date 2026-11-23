import { useMemo, useState } from 'react';
import { getRequestLogger } from '~/.server/logger';
import {
  type Aggregate,
  type CharacterSnapshot,
  type GameMode,
  getSessionAggregates,
  getSnapshotAggregates,
  getSnapshots,
  getUserSessions,
} from '~/api';
import { MapTelemetryPanel } from '~/charts/MapTelemetryPanel';
import { MetricsTrendPanel } from '~/charts/MetricsTrendPanel';
import { Empty } from '~/components/empty';
import { MetricsFilterBar } from '~/components/metrics-filter-bar';
import { useOptionalProfileData } from '~/hooks/use-route-loaders';
import {
  type CustomTimeWindow,
  type TimeWindow,
  generateMapTelemetry,
  generateMatchSeries,
  timeWindowToCustom,
} from '~/lib/metrics';
import { getSiteOrigin } from '~/lib/utils';

import type { Route } from './+types/character-metrics';

const MAX_SESSIONS_TO_AGGREGATE = 20;
const MAX_SNAPSHOTS_TO_AGGREGATE = 15;

export type SnapshotNameMap = Record<
  string,
  Pick<CharacterSnapshot, 'id' | 'name'>
>;

export async function loader({ params, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { id: userId, characterId } = params;

  const [completeSessionsRes, pendingSessionsRes, snapshotsRes] =
    await Promise.all([
      getUserSessions({
        path: { userId },
        query: {
          count: BigInt(MAX_SESSIONS_TO_AGGREGATE),
          page: BigInt(0),
          characterId,
          status: 'complete',
        },
      }),
      getUserSessions({
        path: { userId },
        query: {
          count: BigInt(1),
          page: BigInt(0),
          characterId,
          status: 'pending',
        },
      }),
      getSnapshots({
        query: {
          userId,
          characterId,
          count: MAX_SNAPSHOTS_TO_AGGREGATE,
          page: 0,
          sortBy: 'matches_played',
        },
      }),
    ]);

  if (
    completeSessionsRes.error &&
    pendingSessionsRes.error &&
    snapshotsRes.error
  ) {
    log.error('Failed to fetch character metrics sources', {
      metrics: {
        userId,
        characterId,
        sessionsError: completeSessionsRes.error,
        snapshotsError: snapshotsRes.error,
      },
    });
    return {
      aggregates: [] as Aggregate[],
      snapshots: {} as SnapshotNameMap,
      error: 'Failed to load character metrics',
    };
  }

  const sessions = [
    ...(pendingSessionsRes.data ?? []),
    ...(completeSessionsRes.data ?? []),
  ].slice(0, MAX_SESSIONS_TO_AGGREGATE);

  const snapshotItems = (snapshotsRes.data?.items ?? []).slice(
    0,
    MAX_SNAPSHOTS_TO_AGGREGATE,
  );

  const snapshotMap: SnapshotNameMap = {};
  for (const snap of snapshotItems) {
    snapshotMap[snap.id] = { id: snap.id, name: snap.name };
  }

  const [sessionAggResults, snapshotAggResults] = await Promise.all([
    Promise.all(
      sessions.map((session) =>
        getSessionAggregates({ path: { sessionId: session.id } }),
      ),
    ),
    Promise.all(
      snapshotItems.map(async (snap) => ({
        snapshotId: snap.id,
        res: await getSnapshotAggregates({ path: { snapshotId: snap.id } }),
      })),
    ),
  ]);

  const aggregateByKey = new Map<string, Aggregate>();

  for (const sessionAgg of sessionAggResults) {
    if (!sessionAgg.data) {
      continue;
    }
    for (const [snapId, snap] of Object.entries(sessionAgg.data.snapshots ?? {})) {
      snapshotMap[snapId] = { id: snap.id, name: snap.name };
    }
    for (const agg of sessionAgg.data.aggregates ?? []) {
      if (!agg.performance?.[characterId]) {
        continue;
      }
      const key = agg.id || agg.activityId;
      if (key && !aggregateByKey.has(key)) {
        aggregateByKey.set(key, agg);
      }
    }
  }

  for (const { snapshotId, res } of snapshotAggResults) {
    for (const agg of res.data ?? []) {
      if (!agg.performance?.[characterId]) {
        continue;
      }
      const key = agg.id || agg.activityId;
      if (!key || aggregateByKey.has(key)) {
        continue;
      }
      const existingLink = agg.snapshotLinks?.[characterId];
      const normalizedAgg: Aggregate =
        existingLink?.snapshotId
          ? agg
          : {
              ...agg,
              snapshotLinks: {
                ...agg.snapshotLinks,
                [characterId]: {
                  characterId,
                  snapshotId,
                  confidenceLevel: 'high',
                  confidenceSource: 'system',
                  createdAt: agg.createdAt,
                },
              },
            };
      aggregateByKey.set(key, normalizedAgg);
    }
  }

  const aggregates = Array.from(aggregateByKey.values());

  log.set({
    route: 'routes/character-metrics',
    metrics: {
      userId,
      characterId,
      sessionCount: sessions.length,
      snapshotCount: Object.keys(snapshotMap).length,
      aggregateCount: aggregates.length,
    },
  });

  return {
    aggregates,
    snapshots: snapshotMap,
    error: undefined,
  };
}

export function CharacterMetrics({ loaderData, params }: Route.ComponentProps) {
  const { aggregates, snapshots, error } = loaderData;
  const { id: userId, characterId } = params;
  const profileData = useOptionalProfileData();
  const profile = profileData?.profile;
  const isOwner = profileData?.type === 'owner';

  const activeCharacter = profile?.characters?.find(
    (char) => char.id === characterId,
  );
  const classLabel = activeCharacter?.class
    ? `${activeCharacter.class} `
    : '';
  const displayName = profile?.displayName;

  const headingTitle = isOwner
    ? `${classLabel}Metrics`.trim()
    : `${displayName ?? 'Guardian'}'s ${classLabel}Metrics`.replace(/\s+/g, ' ');
  const pageTitle = displayName
    ? `${classLabel}Metrics - ${displayName} | 1 Trick`
    : `${headingTitle} | 1 Trick`;
  const pageDescription = `Explore cross-loadout Crucible telemetry, rolling consistency trends, and strong vs. swap maps for ${displayName ? `${displayName}'s ` : ''}${activeCharacter?.class ?? 'Guardian'} on 1 Trick.`;
  const origin = getSiteOrigin();
  const canonicalUrl =
    userId && characterId
      ? `https://d2onetrick.com/profile/${userId}/c/${characterId}/metrics`
      : '';

  const metaTags = (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={`${origin}/og-image.png`} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={`${origin}/twitter-image.png`} />
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
    return generateMapTelemetry(
      aggregates,
      customTime,
      characterId,
      gameMode,
      snapshots,
    );
  }, [aggregates, customTime, characterId, gameMode, snapshots]);

  const loadoutBasePath = `/profile/${userId}/c/${characterId}/loadouts`;

  return (
    <div className="flex w-full max-w-full flex-col gap-6 overflow-hidden">
      {metaTags}

      <div className="flex flex-col gap-1 border-b pb-3">
        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight sm:text-3xl">
          {headingTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          Aggregated performance across recorded sessions and loadouts, showing
          rolling consistency and your strongest build for every Crucible map.
        </p>
      </div>

      {error || aggregates.length === 0 ? (
        <Empty
          title={error ? 'Unable to Load Metrics' : 'No Metrics Recorded Yet'}
          description={
            error
              ? 'We encountered an error loading cross-loadout metrics for this Guardian.'
              : 'Record a Crucible session or play matches with a tracked loadout to unlock Guardian-wide map and trend telemetry.'
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <MetricsFilterBar
            time={time}
            onTimeChange={setTime}
            gameMode={gameMode}
            onGameModeChange={setGameMode}
          />

          {matchSeries.points.length === 0 ? (
            <Empty
              title="No Matches in Selected Filter"
              description="Try expanding the date range or switching back to All Modes to view telemetry across your loadouts."
            />
          ) : (
            <div className="flex flex-col gap-6">
              <MetricsTrendPanel
                points={matchSeries.points}
                summary={matchSeries.summary}
                syncId="character-performance"
              />
              <MapTelemetryPanel
                data={mapData}
                title="All-Loadout Map Telemetry"
                description="Strong vs. swap-candidate maps across all recorded loadouts, paired with your top-performing build on each map."
                showBestLoadout
                loadoutBasePath={loadoutBasePath}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CharacterMetrics;
