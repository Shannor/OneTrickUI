import { useMemo, useState } from 'react';
import { getRequestLogger } from '~/.server/logger';
import {
  type GameMode,
  type TelemetryMatch,
  type TelemetrySnapshotSummary,
  getCharacterTelemetry,
} from '~/api';
import { MapTelemetryPanel } from '~/charts/map-telemetry';
import { MetricsTrendPanel } from '~/charts/metrics-trend';
import { Empty } from '~/components/empty';
import { MetricsFilterBar } from '~/components/metrics-filter-bar';
import { TelemetryTruncationNotice } from '~/components/telemetry-truncation-notice';
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

export async function loader({ params, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { id: userId, characterId } = params;

  const { data, error } = await getCharacterTelemetry({
    path: { userId, characterId },
  });

  if (error) {
    log.error('Failed to fetch character telemetry', {
      route: 'routes/character-metrics',
      metrics: { userId, characterId, error },
    });
    return {
      matches: [] as TelemetryMatch[],
      snapshots: {} as Record<string, TelemetrySnapshotSummary>,
      totalCount: 0,
      truncated: false,
      error: 'Failed to load character metrics',
    };
  }

  const matches = data?.matches ?? [];
  const snapshots = data?.snapshots ?? {};
  const totalCount = data?.totalCount ?? matches.length;
  const truncated = Boolean(data?.truncated);

  log.set({
    route: 'routes/character-metrics',
    metrics: {
      userId,
      characterId,
      matchCount: matches.length,
      snapshotCount: Object.keys(snapshots).length,
      totalCount,
      truncated,
    },
  });

  return {
    matches,
    snapshots,
    totalCount,
    truncated,
    error: undefined,
  };
}

export function CharacterMetrics({ loaderData, params }: Route.ComponentProps) {
  const { matches, snapshots, totalCount, truncated, error } = loaderData;
  const { id: userId, characterId } = params;
  const profileData = useOptionalProfileData();
  const profile = profileData?.profile;
  const isOwner = profileData?.type === 'owner';

  const activeCharacter = profile?.characters?.find(
    (char) => char.id === characterId,
  );
  const classLabel = activeCharacter?.class ? `${activeCharacter.class} ` : '';
  const displayName = profile?.displayName;

  const headingTitle = isOwner
    ? `${classLabel}Metrics`.trim()
    : `${displayName ?? 'Guardian'}'s ${classLabel}Metrics`.replace(
        /\s+/g,
        ' ',
      );
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
    return timeWindowToCustom(time, matches);
  }, [time, matches]);

  const matchSeries = useMemo(() => {
    return generateMatchSeries(matches, customTime, gameMode);
  }, [matches, customTime, gameMode]);

  const mapData = useMemo(() => {
    return generateMapTelemetry(matches, customTime, gameMode, snapshots);
  }, [matches, customTime, gameMode, snapshots]);

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

      {error || matches.length === 0 ? (
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
