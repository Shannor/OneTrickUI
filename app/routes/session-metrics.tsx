import { isAfter, isBefore } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router';
import type { Aggregate } from '~/api';
import { Label } from '~/components/label';
import { WeaponHeader } from '~/components/weapon-header';
import { useWeaponsFromLoadout } from '~/hooks/use-loadout';
import { useSessionData } from '~/hooks/use-route-loaders';
import { type KDAResult, generateKDAResultsForTimeWindow } from '~/lib/metrics';
import { Performance, type StatItem } from '~/organisims/performance';

import type { Route } from './+types/session-metrics';

export default function SessionMetrics({ params }: Route.ComponentProps) {
  const { aggregates, snapshots } = useSessionData();
  const { characterId, id } = params;
  const periods = findPeriodBoundaries(aggregates ?? []);
  const groupedBySnapshot = groupAggregates(aggregates ?? [], characterId);

  let data: { snapshotId: string; performance: KDAResult | undefined }[] = [];
  if (!aggregates) {
    return <div>No Aggregates</div>;
  }
  if (!snapshots) {
    return <div>No snapshots</div>;
  }
  if (periods) {
    data = groupedBySnapshot.map(([snapshotId, aggs]) => {
      // The problem is that this only works if the session is 1 day long
      const result = generateKDAResultsForTimeWindow(
        aggs ?? [],
        { start: periods.earliest, end: periods.latest },
        characterId,
      );
      return {
        snapshotId,
        performance: result.pop(),
      };
    });
  }
  return (
    <div>
      <title>Session Metrics</title>
      <meta property="og:title" content="Session Metrics" />
      <meta
        name="description"
        content="View per-loadout performance metrics for this session."
      />
      {data.map(({ snapshotId, performance }) => {
        const snapshot = snapshots[snapshotId];
        const stats: StatItem[] = performance
          ? [
              {
                label: 'Avg. Kills',
                value: performance.avgKills.toString(),
              },
              {
                label: 'Avg. Assists',
                value: performance.avgAssists.toString(),
              },
              {
                label: 'Avg. Deaths',
                value: performance.avgDeaths.toString(),
              },
              { label: 'K/D', value: performance.kd.toFixed(2) },
              { label: 'Efficiency', value: performance.kda.toFixed(2) },
              {
                label: 'Matches',
                value: performance.gameCount.toString(),
              },
              {
                label: 'Win Ratio',
                value: performance.winRatio.toFixed(2),
                valueClassName:
                  performance.winRatio >= 0.5
                    ? 'text-green-500'
                    : 'text-red-500',
              },
            ]
          : [];
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
            {performance ? (
              <Performance stats={stats} />
            ) : (
              <div>No Performance Data</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function findPeriodBoundaries(
  aggregates: Aggregate[],
): PeriodBoundaries | null {
  if (!aggregates.length) return null;

  let earliest = aggregates[0].activityDetails.period;
  let latest = aggregates[0].activityDetails.period;

  for (const aggregate of aggregates) {
    if (isBefore(new Date(aggregate.activityDetails.period), earliest)) {
      earliest = aggregate.activityDetails.period;
    }
    if (isAfter(new Date(aggregate.activityDetails.period), latest)) {
      latest = aggregate.activityDetails.period;
    }
  }

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

  // Convert to array of tuples and sort
  return Object.entries(grouped).sort((a, b) => {
    const aAggsLength = a[1].length;
    const bAggsLength = b[1].length;
    return bAggsLength - aAggsLength;
  });
}
