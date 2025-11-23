import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import React from 'react';
import { Link, useNavigate, useRouteLoaderData } from 'react-router';
import { Empty } from '~/components/empty';
import { Label } from '~/components/label';
import { WeaponHeader } from '~/components/weapon-header';
import { cn, getWeaponsFromLoadout } from '~/lib/utils';
import { Performance } from '~/organisims/performance';
import type { loader } from '~/routes/session';

import type { Route } from './+types/session-games';

export default function SessionGames({ params }: Route.ComponentProps) {
  const { aggregates, snapshots } =
    useRouteLoaderData<typeof loader>('routes/session') ?? {};
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
    <div>
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
          let title = '';
          let titleClassName = '';
          let hasLoadout = false;
          switch (link?.confidenceLevel) {
            case 'high':
              title = 'High Confidence';
              titleClassName = 'bg-green-500 text-white';
              hasLoadout = true;
              break;
            case 'medium':
              title = 'Medium Confidence';
              titleClassName = 'bg-yellow-500 text-white';
              hasLoadout = true;
              break;
            case 'low':
              title = 'Low Confidence';
              titleClassName = 'bg-red-500 text-white';
              hasLoadout = true;
              break;
            case 'noMatch':
              title = 'No Match';
              titleClassName = 'bg-gray-500 text-white';
              break;
            case 'notFound':
              title = 'Not Found';
              titleClassName = 'bg-gray-500 text-white';
              break;
            default:
              title = 'Unknown';
              titleClassName = 'bg-gray-500 text-white';
          }
          const previous = index > 0 ? arr[index - 1] : undefined;
          const showLoadout =
            !previous ||
            previous.snapshotLinks[characterId]?.snapshotId !== link.snapshotId;

          return (
            <div key={value.id} className={cn('flex flex-col gap-4 p-4')}>
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
                <div className={cn('flex flex-col gap-4 border-b-4 p-4')}>
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
                    {getWeaponsFromLoadout(snapshot.loadout).map((weapon) => (
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
                className="flex w-full flex-row gap-8 p-4 hover:bg-muted"
                onClick={() => {
                  navigate(
                    `/profile/${id}/c/${characterId}/activities/${activityDetails.instanceId}`,
                  );
                }}
              >
                <img
                  src={activityDetails.imageUrl}
                  className="h-auto w-36 rounded-lg object-cover"
                  alt="activity image"
                />
                <div className="flex flex-col gap-2">
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
                  <Performance performances={[performance]} />
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
