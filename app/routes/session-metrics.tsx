import { log } from 'evlog';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import type { Aggregate, CharacterSnapshot } from '~/api';
import { calculatePercentage, calculateRatio } from '~/calculations/precision';
import { MapTelemetryPanel } from '~/charts/map-telemetry';
import { Empty } from '~/components/empty';
import { Label } from '~/components/label';
import { WeaponHeader } from '~/components/weapon-header';
import { getWeapons } from '~/hooks/use-loadout';
import {
  useOptionalProfileData,
  useSessionData,
} from '~/hooks/use-route-loaders';
import { generateMapTelemetry, timeWindowToCustom } from '~/lib/metrics';
import { Performance } from '~/organisims/performance';

import type { Route } from './+types/session-metrics';

export function SessionMetrics({ params }: Route.ComponentProps) {
  const { aggregates, snapshots, session, path } = useSessionData();
  const { profile } = useOptionalProfileData() ?? {};
  const { characterId, id } = params;

  const sessionName = session?.name || 'Session';
  const displayName = profile?.displayName;
  const sessionNameText = session?.name ? ` ${session.name}` : '';

  const pageTitle = displayName
    ? `${sessionName} - ${displayName} Metrics | 1 Trick`
    : `${sessionName} Metrics | 1 Trick`;

  const pageDescription =
    session?.description ||
    `View per-loadout performance metrics for ${displayName ?? 'player'}'s session${sessionNameText} on 1 Trick.`;

  const canonicalUrl = path ? `${path}/metrics` : '';
  const origin = path ? new URL(path).origin : 'https://d2onetrick.com';
  const ogImageUrl = session?.id
    ? `${origin}/og/session/${session.id}.png`
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

  if (!aggregates || aggregates.length === 0) {
    return (
      <>
        {metaTags}
        <Empty
          title="Get in the Crucible!"
          description="Play some games so we can get new information!"
        />
      </>
    );
  }

  if (!snapshots || Object.keys(snapshots).length === 0) {
    return (
      <>
        {metaTags}
        <Empty
          title="Get in the Crucible!"
          description="Play some games so we can get new information!"
        />
      </>
    );
  }

  const groupedBySnapshot = groupAggregates(aggregates, characterId);
  const data = getLoadoutData(groupedBySnapshot, characterId);
  const overallTuple = [['overall', aggregates]] as GroupTuple[];
  const [overallItem] = getLoadoutData(
    overallTuple,
    characterId,
    true,
    snapshots,
  );
  const { stats, matchStats, rawStats, mapData: overallMapData } = overallItem;
  const loadoutBasePath = `/profile/${id}/c/${characterId}/loadouts`;

  return (
    <div className="mt-8 flex flex-col gap-14">
      {metaTags}
      <div className="flex flex-col gap-6">
        <h4 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Session Metrics
        </h4>
        <h5 className="text-xl font-semibold tracking-tight">Overall</h5>
        <div className="flex flex-col gap-4 md:flex-row md:gap-0 md:divide-x md:divide-gray-500">
          <Performance stats={stats} className="md:pr-2" />
          <Performance stats={matchStats} className="md:px-2" />
          <Performance stats={rawStats} className="md:px-2" />
        </div>
        <div className="text-sm text-muted-foreground">
          Stats for all games including ones where no snapshot was found.
        </div>
        <MapTelemetryPanel
          data={overallMapData}
          title="Session Map Telemetry"
          description="Overall map performance across this session, including your top build per map."
          showBestLoadout
          loadoutBasePath={loadoutBasePath}
        />
      </div>

      <div className="flex flex-col gap-16">
        {data?.map(({ snapshotId, stats, mapData, matchStats, rawStats }) => {
          const snapshot = snapshots[snapshotId];
          if (!snapshot) {
            return null;
          }
          const weapons = getWeapons(snapshot.loadout);

          return (
            <div className="flex flex-col gap-5" key={snapshotId}>
              <div className="group flex flex-row items-center gap-2">
                <Link to={`${loadoutBasePath}/${snapshotId}`}>
                  <Label className="group-hover:text-blue-400 group-hover:underline">
                    {snapshot?.name ?? 'Snapshot'}
                  </Label>
                </Link>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 group-hover:underline" />
              </div>
              <div className="flex flex-row gap-4">
                {weapons.map((weapon) => (
                  <WeaponHeader
                    key={weapon.itemHash}
                    properties={weapon.details}
                    onlyIcon
                  />
                ))}
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:gap-0 md:divide-x md:divide-gray-500">
                <Performance stats={stats} className="md:pr-2" />
                <Performance stats={matchStats} className="md:px-2" />
                <Performance stats={rawStats} className="md:px-2" />
              </div>
              <MapTelemetryPanel
                data={mapData}
                title="Loadout Map Telemetry"
                description="Strong vs. swap-candidate maps for this loadout during the session."
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SessionMetrics;

type GroupTuple = [string, Aggregate[]];

function groupAggregates(
  aggregates: Aggregate[],
  characterId: string,
): GroupTuple[] {
  const grouped = aggregates.reduce(
    (state, current) => {
      const link = current.snapshotLinks[characterId];
      if (!link) {
        return state;
      }
      switch (link.confidenceLevel) {
        case 'high':
        case 'medium':
        case 'low':
          if (link.snapshotId) {
            if (state[link.snapshotId]) {
              state[link.snapshotId].push(current);
            } else {
              state[link.snapshotId] = [current];
            }
          } else {
            log.warn(
              'session-metrics',
              "Applied confidence level to aggregate but didn't have a snapshotId",
            );
          }
          break;
      }
      return state;
    },
    {} as Record<string, Aggregate[]>,
  );

  return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
}

function getLoadoutData(
  groupedBySnapshot: GroupTuple[],
  characterId: string,
  allowAll: boolean = false,
  snapshots?: Record<string, CharacterSnapshot>,
) {
  return groupedBySnapshot.map(([snapshotId, aggs]) => {
    const performances = getPerformances(aggs, characterId, allowAll);
    const customTime = timeWindowToCustom('all-time', aggs);
    const { wins, kills, deaths, assists } = performances.reduce(
      (state, p) => {
        state.kills += p.playerStats.kills?.value ?? 0;
        state.deaths += p.playerStats.deaths?.value ?? 0;
        state.assists += p.playerStats.assists?.value ?? 0;
        state.wins += p.playerStats.standing?.value === 0 ? 1 : 0;
        return state;
      },
      {
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
      },
    );

    const winPercentage = calculatePercentage(wins, performances.length);
    const kd = calculateRatio(kills, deaths);
    const kda = calculateRatio(kills + assists, deaths);
    const rawStats = [
      { label: 'Kills', value: kills.toString() },
      { label: 'Deaths', value: deaths.toString() },
      { label: 'Assists', value: assists.toString() },
    ];
    const stats = [
      { label: 'K/D', value: kd.toFixed(2) },
      { label: 'Efficiency', value: kda.toFixed(2) },
    ];
    const matchStats = [];
    if (performances.length >= 1) {
      matchStats.push({
        label: 'Matches',
        value: performances.length.toString(),
      });

      matchStats.push({
        label: 'Win %',
        value: `${winPercentage.toFixed(0)}%`,
        valueClassName: winPercentage >= 50 ? 'text-green-500' : 'text-red-500',
      });
    }

    const mapData = generateMapTelemetry(
      aggs,
      customTime,
      characterId,
      'allGameModes',
      snapshots,
    );
    return {
      snapshotId,
      stats,
      rawStats,
      matchStats,
      mapData,
      time: customTime,
    };
  });
}

function getPerformances(
  aggregates: Aggregate[],
  characterId: string,
  allowAll: boolean = false,
) {
  return aggregates
    .map((agg) => {
      const snapshot = agg.snapshotLinks[characterId];
      if (allowAll) {
        return agg.performance[characterId];
      }
      if (
        snapshot &&
        snapshot.confidenceLevel !== 'noMatch' &&
        snapshot.confidenceLevel !== 'notFound'
      ) {
        return agg.performance[characterId];
      }
      return null;
    })
    .filter((x) => !!x);
}
