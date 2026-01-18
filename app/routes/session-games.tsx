import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router';
import { calculateRatio } from '~/calculations/precision';
import { Empty } from '~/components/empty';
import { HorizontalBanner } from '~/components/horizontal-banner';
import { Label } from '~/components/label';
import VerticalBanner from '~/components/vertical-banner';
import { WeaponHeader } from '~/components/weapon-header';
import { getWeapons } from '~/hooks/use-loadout';
import { useSessionData } from '~/hooks/use-route-loaders';
import { cn } from '~/lib/utils';
import { Performance, type StatItem } from '~/organisims/performance';

import type { Route } from './+types/session-games';

export default function SessionGames({ params }: Route.ComponentProps) {
  const { aggregates, snapshots } = useSessionData();
  const { characterId, id } = params;
  const navigate = useNavigate();

  if (!aggregates || aggregates?.length === 0) {
    return (
      <Empty
        title="No Games Found"
        description="No games were found for this session."
      />
    );
  }

  if (!snapshots) {
    return (
      <Empty
        title="No Games Found"
        description="No games were found for this session."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-6">
      <title>Session Games</title>
      <meta property="og:title" content="Session Games" />
      <meta
        name="description"
        content="Browse games from this session, loadouts, and performance details."
      />
      {aggregates
        .sort(
          (a, b) =>
            new Date(b.activityDetails.period).getTime() -
            new Date(a.activityDetails.period).getTime(),
        )
        .map((value, index, arr) => {
          const {
            activityDetails,
            snapshotLinks,
            performance: performances,
          } = value;

          const link = snapshotLinks[characterId];
          const performance = performances[characterId];
          const snapshot = link.snapshotId
            ? snapshots[link.snapshotId]
            : undefined;

          let hasLoadout = false;
          switch (link?.confidenceLevel) {
            case 'high':
              hasLoadout = true;
              break;
            case 'medium':
              hasLoadout = true;
              break;
            case 'low':
              hasLoadout = true;
              break;
          }

          const previous = index > 0 ? arr[index - 1] : undefined;
          const showLoadout =
            !previous ||
            previous.snapshotLinks[characterId]?.snapshotId !== link.snapshotId;
          const won = performance?.playerStats?.standing?.value === 0;

          const stats: StatItem[] = [];
          const kdStats: StatItem[] = [];
          if (performance) {
            const kills = performance.playerStats.kills?.value ?? 0;
            const assists = performance.playerStats.assists?.value ?? 0;
            const deaths = performance.playerStats.deaths?.value ?? 0;
            const kd = calculateRatio(kills, deaths);
            const kda = calculateRatio(kills + assists, deaths);
            stats.push(
              ...[
                { label: 'Kills', value: kills.toString() },
                { label: 'Assists', value: assists.toString() },
                { label: 'Deaths', value: deaths.toString() },
              ],
            );
            kdStats.push(
              ...[
                { label: 'K/D', value: kd.toFixed(2) },
                { label: 'Efficiency', value: kda.toFixed(2) },
              ],
            );
          }

          return (
            <div key={value.id} className={cn('flex flex-col gap-4')}>
              {!hasLoadout && (
                <div
                  className={cn(
                    'flex flex-row items-center gap-4 border-b-4 p-4',
                  )}
                >
                  No Found Loadout for Games
                </div>
              )}
              {snapshot && showLoadout && (
                <div className={cn('flex flex-col gap-4 border-b-4 py-4')}>
                  <div className="group flex flex-row gap-2">
                    <Link
                      to={`/profile/${id}/c/${characterId}/loadouts/${snapshot.id}`}
                    >
                      <Label className="group-hover:text-blue-400 group-hover:underline">
                        {snapshot?.name ?? 'Snapshot'}
                      </Label>
                    </Link>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 group-hover:underline" />
                  </div>
                  <div
                    className={cn('flex flex-row gap-4', {
                      hidden: !hasLoadout,
                    })}
                  >
                    {getWeapons(snapshot.loadout).map((weapon) => (
                      <WeaponHeader
                        key={weapon.itemHash}
                        properties={weapon.details}
                        onlyIcon
                      />
                    ))}
                  </div>
                </div>
              )}
              <div
                className="flex w-full flex-row hover:bg-muted md:gap-8"
                onClick={() => {
                  navigate(
                    `/profile/${id}/c/${characterId}/activities/${activityDetails.instanceId}`,
                  );
                }}
              >
                <div className="hidden flex-row gap-2 md:flex">
                  {won ? (
                    <VerticalBanner
                      label="Victory"
                      className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
                    />
                  ) : (
                    <VerticalBanner
                      label="Defeat"
                      className="bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100"
                    />
                  )}
                  <img
                    src={activityDetails.imageUrl}
                    className="hidden h-auto w-36 rounded-lg object-cover md:block md:w-28"
                    alt="activity image"
                  />
                </div>
                <div className="flex w-full flex-col gap-4 md:w-auto">
                  <div className="flex flex-col gap-4 md:hidden">
                    {won ? (
                      <HorizontalBanner
                        label="Victory"
                        className="h-5 bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
                      />
                    ) : (
                      <HorizontalBanner
                        label="Defeat"
                        className="h-5 bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100"
                      />
                    )}
                    <img
                      src={activityDetails.imageUrl}
                      className="h-28 w-full rounded-lg object-cover md:hidden"
                      alt="activity image"
                    />
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <img
                      src={activityDetails.activityIcon}
                      className="h-12 w-12 rounded-lg bg-black/50 object-cover"
                      alt="activity image"
                    />
                    <div className="flex flex-col gap-2">
                      <Description
                        activity={activityDetails.activity}
                        mode={activityDetails.mode}
                      />
                      <div className="text-xl font-bold">
                        {activityDetails.location}
                      </div>

                      <div className="text-muted-foreground">
                        {format(new Date(activityDetails.period), 'p')}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 md:flex-row md:gap-0 md:divide-x md:divide-gray-500">
                    <Performance stats={stats} className="md:pr-2" />
                    <Performance stats={kdStats} className={'md:px-2'} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function Description({ activity, mode }: { activity: string; mode?: string }) {
  const ironBanner = 'iron banner';
  if (activity.toLowerCase().includes(ironBanner)) {
    return (
      <div className="text-sm uppercase tracking-wide text-muted-foreground">
        {activity}
      </div>
    );
  }
  const control = 'control';
  const trials = 'trials of osiris';
  const competitive = 'competitive';

  let label = activity;
  let modeLabel = mode;
  if (activity.toLowerCase().includes(control)) {
    label = 'Quickplay';
    if (mode) {
      modeLabel = mode.replace('Quickplay', '');
    }
  } else if (activity.toLowerCase().includes(competitive)) {
    label = 'Competitive';
    if (mode) {
      modeLabel = mode.replace('Competitive', '').replace('Quickplay', '');
    }
  } else if (activity.toLowerCase().includes(trials)) {
    label = 'Trials of Osiris';
    if (mode) {
      modeLabel = mode.replace('Trials of Osiris', '');
    }
  }
  return (
    <div className="text-sm uppercase tracking-wide text-muted-foreground">
      {label}
      {modeLabel && <span>{' - ' + modeLabel}</span>}
    </div>
  );
}
