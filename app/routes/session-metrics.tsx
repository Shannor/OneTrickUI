import { ExternalLink } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router';
import type { Aggregate, Session } from '~/api';
import { calculateRatio } from '~/calculations/precision';
import { ChartWrapper } from '~/charts/ChartWrapper';
import { MapCount } from '~/charts/MapCount';
import { MapPerformance } from '~/charts/MapPerformance';
import { Empty } from '~/components/empty';
import { Label } from '~/components/label';
import { WeaponHeader } from '~/components/weapon-header';
import { useWeaponsFromLoadout } from '~/hooks/use-loadout';
import { useSessionData } from '~/hooks/use-route-loaders';
import { generatePerformancePerMap } from '~/lib/metrics';
import { Performance } from '~/organisims/performance';

import type { Route } from './+types/session-metrics';

export default function SessionMetrics({ params }: Route.ComponentProps) {
  const { aggregates, snapshots, session } = useSessionData();
  const { characterId, id } = params;

  const periods = findPeriodBoundaries(aggregates ?? [], session);
  const groupedBySnapshot = groupAggregates(aggregates ?? [], characterId);

  if (!aggregates) {
    return (
      <Empty
        title="No Matches Found"
        description="No matches found for this session."
      />
    );
  }
  if (!snapshots) {
    return (
      <Empty
        title="No Loadouts Found"
        description="No loadouts were found for this session."
      />
    );
  }
  const data = getLoadoutData(
    periods,
    groupedBySnapshot,
    characterId,
    aggregates,
  );
  return (
    <div>
      <title>{`${session?.name} - Metrics`}</title>
      <meta property="og:title" content={`${session?.name} Metrics`} />
      <meta
        name="description"
        content="View per-loadout performance metrics for this session."
      />
      {data?.map(({ snapshotId, stats, mapData, time }) => {
        const snapshot = snapshots[snapshotId];
        return (
          <div className="flex flex-col gap-4 p-4" key={snapshotId}>
            <div className="group flex flex-row gap-2">
              <Link
                to={`/profile/${id}/c/${characterId}/loadouts/${snapshotId}`}
              >
                <Label className="group-hover:text-blue-400 group-hover:underline">
                  {snapshot?.name ?? 'Snapshot'}
                </Label>
              </Link>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 group-hover:underline" />
            </div>
            <div className="flex flex-row gap-4">
              {useWeaponsFromLoadout(snapshot.loadout).map((weapon) => (
                <WeaponHeader
                  key={weapon.itemHash}
                  properties={weapon.details}
                  onlyIcon
                />
              ))}
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
              <Performance stats={stats} />
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
              <ChartWrapper
                title="Map Performance"
                description="Shows the map performance for the session with the loadout"
              >
                <MapPerformance
                  data={mapData}
                  timeWindow={time}
                  syncId={`map-${snapshotId}`}
                />
              </ChartWrapper>
              <ChartWrapper
                title="Map Count"
                description="Shows the number of games played for each map with a given loadout."
              >
                <MapCount
                  data={mapData}
                  timeWindow={time}
                  syncId={`map-${snapshotId}`}
                />
              </ChartWrapper>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function findPeriodBoundaries(
  aggregates: Aggregate[],
  session: Session,
): PeriodBoundaries | null {
  if (!aggregates.length) {
    return {
      earliest: session.startedAt,
      latest: new Date(),
    };
  }

  const sorted = [...aggregates].sort(
    (a, b) =>
      new Date(b.activityDetails.period).getTime() -
      new Date(a.activityDetails.period).getTime(),
  );
  const latest = new Date(sorted[0].activityDetails.period);
  const earliest = new Date(sorted[sorted.length - 1].activityDetails.period);

  return { earliest, latest };
}

type GroupTuple = [string, Aggregate[]];
type PeriodBoundaries = {
  earliest: Date;
  latest: Date;
};

function groupAggregates(
  aggregates: Aggregate[],
  characterId: string,
): GroupTuple[] {
  // Group by Snapshot Id
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
            console.warn(
              "Applied confidence level to aggregate but didn't have a snapshotId",
            );
          }
          break;
      }
      return state;
    },
    {} as Record<string, Aggregate[]>,
  );

  // Convert to an array of tuples and sort
  return Object.entries(grouped).sort((a, b) => {
    const aAggsLength = a[1].length;
    const bAggsLength = b[1].length;
    return bAggsLength - aAggsLength;
  });
}

function getLoadoutData(
  periods: PeriodBoundaries | null,
  groupedBySnapshot: GroupTuple[],
  characterId: string,
  aggregates: Aggregate[],
) {
  if (!periods) {
    return;
  }
  const time = { start: periods.earliest, end: periods.latest };
  return groupedBySnapshot.map(([snapshotId, aggs]) => {
    const performances = getPerformances(aggs, characterId);
    const { wins } = performances.reduce(
      (state, p) => {
        state.wins += p.playerStats.standing?.value === 0 ? 1 : 0;
        return state;
      },
      {
        wins: 0,
      },
    );

    const winRatio = calculateRatio(wins, performances.length);
    const stats = [];
    if (performances.length > 1) {
      stats.push({
        label: 'Matches',
        value: performances.length.toString(),
      });
      stats.push({
        label: 'Win Ratio',
        value: winRatio.toFixed(2),
        valueClassName: winRatio >= 0.5 ? 'text-green-500' : 'text-red-500',
      });
    }
    const mapData = generatePerformancePerMap(aggs, time, characterId);
    return {
      snapshotId,
      stats,
      mapData,
      time,
    };
  });
}
function getPerformances(aggregates: Aggregate[], characterId: string) {
  return aggregates
    .map((agg) => {
      const snapshot = agg.snapshotLinks[characterId];
      if (
        snapshot.confidenceLevel !== 'noMatch' &&
        snapshot.confidenceLevel !== 'notFound'
      ) {
        return agg.performance[characterId];
      }
      return null;
    })
    .filter((x) => !!x);
}
