import { log } from 'evlog';
import { ExternalLink } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import type { Aggregate, CharacterSnapshot } from '~/api';
import { calculatePercentage, calculateRatio } from '~/calculations/precision';
import { MapTelemetryPanel } from '~/charts/map-telemetry';
import { Empty } from '~/components/empty';
import { EmptyFilteredMatches } from '~/components/session-companions';
import { WeaponHeader } from '~/components/weapon-header';
import { getWeapons } from '~/hooks/use-loadout';
import {
  useOptionalProfileData,
  useSessionData,
} from '~/hooks/use-route-loaders';
import { useSessionCompanionFilter } from '~/hooks/use-session-companion-filter';
import {
  aggregatesToTelemetryMatches,
  generateMapTelemetry,
  timeWindowToCustom,
} from '~/lib/metrics';
import { formatSelectedCompanionNames } from '~/lib/session-companions';
import { Performance } from '~/organisims/performance';

import type { Route } from './+types/session-metrics';

export function SessionMetrics({ params }: Route.ComponentProps) {
  const { aggregates, snapshots, participants, session, path } =
    useSessionData();
  const { profile } = useOptionalProfileData() ?? {};
  const { characterId, id } = params;

  const { selectedCompanions, filteredAggregates, clearFilters } =
    useSessionCompanionFilter({
      session,
      aggregates,
      participants,
      characterId,
    });

  const { data, overallItem } = useMemo(() => {
    if (filteredAggregates.length === 0) {
      return { data: [], overallItem: undefined };
    }
    const groupedBySnapshot = groupAggregates(filteredAggregates, characterId);
    const loadoutData = getLoadoutData(groupedBySnapshot, characterId);
    const overallTuple = [['overall', filteredAggregates]] as GroupTuple[];
    const [overall] = getLoadoutData(
      overallTuple,
      characterId,
      true,
      snapshots,
    );
    return { data: loadoutData, overallItem: overall };
  }, [filteredAggregates, characterId, snapshots]);

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

  const hasTeammateFilter = selectedCompanions.length > 0;
  const selectedNamesLabel = formatSelectedCompanionNames(selectedCompanions);

  if (hasTeammateFilter && (!overallItem || filteredAggregates.length === 0)) {
    return (
      <div className="mt-4">
        {metaTags}
        <EmptyFilteredMatches
          selectedCompanions={selectedCompanions}
          onClearFilters={clearFilters}
          context="metrics"
        />
      </div>
    );
  }

  if (!overallItem) {
    return null;
  }

  const { stats, matchStats, rawStats, mapData: overallMapData } = overallItem;
  const loadoutBasePath = `/profile/${id}/c/${characterId}/loadouts`;
  const overallCaption = hasTeammateFilter
    ? `Stats for ${filteredAggregates.length} ${filteredAggregates.length === 1 ? 'match' : 'matches'} with ${selectedNamesLabel}, including games where no snapshot was found.`
    : 'Stats for all games including ones where no snapshot was found.';

  return (
    <div className="mt-4 flex flex-col gap-14">
      {metaTags}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 border-b border-border pb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:text-sm">
            Session Metrics
          </span>
          <h2 className="scroll-m-20 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Overall
          </h2>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:gap-0 md:divide-x md:divide-border/60">
          <Performance stats={stats} className="md:pr-4" />
          <Performance stats={matchStats} className="md:px-4" />
          <Performance stats={rawStats} className="md:pl-4" />
        </div>
        <div className="text-sm text-muted-foreground">{overallCaption}</div>
        <MapTelemetryPanel
          data={overallMapData}
          title="Session Map Telemetry"
          description="Overall map performance across this session, including your top build per map."
          showBestLoadout
          loadoutBasePath={loadoutBasePath}
        />
      </div>

      {data.length > 0 && (
        <div className="flex flex-col gap-12">
          <h3 className="scroll-m-20 border-b border-border pb-2 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            By Loadout
          </h3>
          <div className="flex flex-col gap-16">
            {data.map(
              ({ snapshotId, stats, mapData, matchStats, rawStats }) => {
                const snapshot = snapshots[snapshotId];
                if (!snapshot) {
                  return null;
                }
                const weapons = getWeapons(snapshot.loadout);

                return (
                  <div className="flex flex-col gap-5" key={snapshotId}>
                    <Link
                      to={`${loadoutBasePath}/${snapshotId}`}
                      className="group inline-flex min-h-11 w-full touch-manipulation items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3.5 py-2 text-base font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-0 sm:w-fit sm:justify-start sm:rounded-md sm:px-2.5 sm:py-1 sm:text-sm"
                    >
                      <span className="truncate group-hover:underline">
                        {snapshot?.name ?? 'Snapshot'}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary sm:h-3.5 sm:w-3.5" />
                    </Link>
                    <div className="flex flex-row gap-4">
                      {weapons.map((weapon) => (
                        <WeaponHeader
                          key={weapon.itemHash}
                          properties={weapon.details}
                          onlyIcon
                        />
                      ))}
                    </div>
                    <div className="flex flex-col gap-4 md:flex-row md:gap-0 md:divide-x md:divide-border/60">
                      <Performance stats={stats} className="md:pr-4" />
                      <Performance stats={matchStats} className="md:px-4" />
                      <Performance stats={rawStats} className="md:pl-4" />
                    </div>
                    <MapTelemetryPanel
                      data={mapData}
                      title="Loadout Map Telemetry"
                      description="Strong vs. swap-candidate maps for this loadout during the session."
                    />
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
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
    const matches = aggregatesToTelemetryMatches(aggs, characterId);
    const customTime = timeWindowToCustom('all-time', matches);
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
      matches,
      customTime,
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
