import { ExternalLink } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router';
import type { Aggregate } from '~/api';
import { calculateRatio } from '~/calculations/precision';
import { ChartWrapper } from '~/charts/ChartWrapper';
import { MapPerformance } from '~/charts/MapPerformance';
import { MapWinRate } from '~/charts/MapWinRate';
import { Empty } from '~/components/empty';
import { Label } from '~/components/label';
import { WeaponHeader } from '~/components/weapon-header';
import { getWeapons } from '~/hooks/use-loadout';
import { useSessionData } from '~/hooks/use-route-loaders';
import { generatePerformancePerMap, timeWindowToCustom } from '~/lib/metrics';
import { Performance } from '~/organisims/performance';

import type { Route } from './+types/session-metrics';

export default function SessionMetrics({ params }: Route.ComponentProps) {
  const { aggregates, snapshots, session } = useSessionData();
  const { characterId, id } = params;

  const groupedBySnapshot = groupAggregates(aggregates ?? [], characterId);
  const data = getLoadoutData(groupedBySnapshot, characterId);
  const fake = [['test', aggregates ?? []]] as GroupTuple[];
  const [item] = getLoadoutData(fake, characterId, true);
  const { stats, matchStats, rawStats } = item;

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

  return (
    <div className="mt-8 flex flex-col gap-16">
      <title>{`${session?.name} - Metrics`}</title>
      <meta property="og:title" content={`${session?.name} Metrics`} />
      <meta
        name="description"
        content="View per-loadout performance metrics for this session."
      />
      <div className="flex flex-col gap-6">
        <h4 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Session Metrics
        </h4>
        <h5 className="text-xl font-semibold tracking-tight">Overall</h5>
        <div className="flex flex-col gap-4 md:flex-row md:gap-0 md:divide-x md:divide-gray-500">
          <Performance stats={stats} className="md:pr-2" />
          <Performance stats={matchStats} className={'md:px-2'} />
          <Performance stats={rawStats} className={'md:px-2'} />
        </div>
        <div className="text-sm text-muted-foreground">
          Stats for all games including ones where no snapshot was found.
        </div>
      </div>
      <div className="flex flex-col gap-20">
        {data?.map(
          ({ snapshotId, stats, mapData, time, matchStats, rawStats }) => {
            const snapshot = snapshots[snapshotId];
            const weapons = getWeapons(snapshot.loadout);

            return (
              <div className="flex flex-col gap-4" key={snapshotId}>
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
                  <Performance stats={matchStats} className={'md:px-2'} />
                  <Performance stats={rawStats} className={'md:px-2'} />
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
                    title="Map Win Rate"
                    description="Shows the number wins and losses for each map with a given loadout."
                  >
                    <MapWinRate
                      data={mapData}
                      timeWindow={time}
                      syncId={`map-${snapshotId}`}
                    />
                  </ChartWrapper>
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

type GroupTuple = [string, Aggregate[]];
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
  groupedBySnapshot: GroupTuple[],
  characterId: string,
  allowAll: boolean = false,
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

    const winRatio = calculateRatio(wins, performances.length, {
      decimalPlaces: 3,
    });
    const kd = calculateRatio(kills, deaths);
    const kda = calculateRatio(kills + assists, deaths);
    const rawStats = [
      { label: 'Kills', value: kills.toString() },
      { label: 'Deaths', value: deaths.toString() },
      { label: 'Assists', value: assists.toString() },
    ];
    const stats = [];
    stats.push({
      label: 'K/D',
      value: kd.toFixed(2),
    });
    stats.push({
      label: 'Efficiency',
      value: kda.toFixed(2),
    });
    const matchStats = [];
    if (performances.length >= 1) {
      matchStats.push({
        label: 'Matches',
        value: performances.length.toString(),
      });

      const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 3,
      });
      matchStats.push({
        label: 'Win Ratio',
        value: formatter.format(winRatio),
        valueClassName: winRatio >= 0.5 ? 'text-green-500' : 'text-red-500',
      });
    }

    const mapData = generatePerformancePerMap(aggs, customTime, characterId);
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
        snapshot.confidenceLevel !== 'noMatch' &&
        snapshot.confidenceLevel !== 'notFound'
      ) {
        return agg.performance[characterId];
      }
      return null;
    })
    .filter((x) => !!x);
}
