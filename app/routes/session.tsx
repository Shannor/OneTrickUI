import { format } from 'date-fns';
import { ExternalLink, Share2 } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { getAuth } from '~/.server/auth';
import { type Aggregate, getSession, getSessionAggregates } from '~/api';
import { Empty } from '~/components/empty';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { WeaponHeader } from '~/components/weapon-header';
import { cn, getWeaponsFromLoadout } from '~/lib/utils';
import { Performance } from '~/organisims/performance';

import type { Route } from './+types/session';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { sessionId } = params;

  const auth = await getAuth(request);
  if (!auth) {
    throw new Error('Not authenticated');
  }

  const res = await getSession({
    path: {
      sessionId,
    },
  });

  if (!res.data) {
    return { session: undefined, error: 'Session Not Found' };
  }
  const aggRes = await getSessionAggregates({
    path: {
      sessionId,
    },
  });

  const sharablePath = `profiles/${auth.id}/sessions/${sessionId}`;
  let path = '';
  if (process.env.NODE_ENV === 'development') {
    path = `https://local.d2onetrick.ngrok.app/${sharablePath}`;
  } else {
    path = `https://d2onetrick.com/${sharablePath}`;
  }
  if (!aggRes.data) {
    return {
      session: res.data,
      aggregates: [],
      snapshots: {},
      error: undefined,
      path,
    };
  }
  return {
    session: res.data,
    aggregates: aggRes.data.aggregates,
    snapshots: aggRes.data.snapshots,
    error: undefined,
    path,
  };
}

export default function Session({ loaderData }: Route.ComponentProps) {
  const { session, error, aggregates, snapshots, path } = loaderData;
  const navigate = useNavigate();

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <Empty
          title="No Session Found"
          description="Error loading this session. Please try again later."
        />
      </div>
    );
  }

  if (error) {
    console.error(error);
    return (
      <div>
        <Empty
          title="Error loading Session"
          description="Error loading this session. Please try again later."
        />
      </div>
    );
  }

  const isCurrent = session.status === 'pending';
  const group = groupAggregates(aggregates, session.characterId);

  const allPerformances = group.flatMap(([_, value]) =>
    value.map((a) => a.performance[session.characterId]),
  );

  const [copyStatus, setCopyStatus] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(path);
      setCopyStatus('Copied!');
    } catch (err) {
      setCopyStatus('Failed to copy!');
      console.error('Failed to copy text: ', err);
    }
    setTimeout(() => setCopyStatus(''), 2000);
  };

  return (
    <div>
      <div className="flex flex-col items-start gap-4 p-4">
        {isCurrent && <Badge className="animate-pulse">Active</Badge>}
        <div className="flex flex-row gap-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            {session.name}
          </h2>
          <Tooltip open={Boolean(copyStatus)}>
            <TooltipContent>{copyStatus}</TooltipContent>
            <TooltipTrigger asChild>
              <Button onClick={handleCopy} variant="outline">
                <Share2 className="h-6 w-6" /> Share
              </Button>
            </TooltipTrigger>
          </Tooltip>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(session.startedAt, 'MM/dd/yyyy - p')}
          {session.completedAt
            ? ` - ${format(session.completedAt, 'MM/dd/yyyy - p')}`
            : ''}
        </div>
        <Performance performances={allPerformances} />
      </div>
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
          const link = snapshotLinks[session.characterId];
          const performance = performances[session.characterId];
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
            previous.snapshotLinks[session.characterId]?.snapshotId !==
              link.snapshotId;

          return (
            <div className={cn('flex flex-col gap-4 p-4')}>
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
                <div
                  className={cn(
                    'flex flex-row items-center gap-4 border-b-4 p-4',
                  )}
                >
                  {getWeaponsFromLoadout(snapshot.loadout).map((weapon) => (
                    <WeaponHeader
                      key={weapon.itemHash}
                      properties={weapon.details}
                      onlyIcon
                    />
                  ))}
                  <Button variant="ghost">
                    <Link to={`/dashboard/loadouts/${snapshot.id}`}>
                      View Loadout
                    </Link>
                    <ExternalLink />
                  </Button>
                </div>
              )}
              <div
                className="flex w-full flex-row gap-8 p-4 hover:bg-muted"
                onClick={() => {
                  navigate(
                    `/dashboard/activities/${activityDetails.instanceId}`,
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
      {/*{group.map(([key, value]) => {*/}
      {/*  const snapshot: CharacterSnapshot | undefined = snapshots[key];*/}
      {/*  const values = Object.values(snapshot.stats ?? {})*/}
      {/*    .map((stat) => ({*/}
      {/*      stat: stat.name,*/}
      {/*      value: stat.value ?? 0,*/}
      {/*    }))*/}
      {/*    .filter((it) => it.stat !== 'Power');*/}
      {/*  let title = '';*/}
      {/*  switch (key) {*/}
      {/*    case 'notFound':*/}
      {/*      title = 'No Found Snapshots';*/}
      {/*      break;*/}
      {/*    case 'noMatch':*/}
      {/*      title = 'No Matching Weapons';*/}
      {/*      break;*/}
      {/*    default:*/}
      {/*      title = snapshot?.name ?? 'Unknown';*/}
      {/*  }*/}
      {/*  const performances = value.map(*/}
      {/*    (a) => a.performance[session.characterId],*/}
      {/*  );*/}

      {/*  return (*/}
      {/*    <div key={key} className="flex flex-col gap-6 border-b p-4">*/}
      {/*      <Performance performances={performances} />*/}
      {/*      <div className="flex flex-row gap-4">*/}
      {/*        <Class snapshot={snapshot} />*/}
      {/*        <ClassStats data={values} />*/}
      {/*      </div>*/}
      {/*      <Loadout performances={performances} snapshot={snapshot} />*/}
      {/*      <CollapsibleMaps*/}
      {/*        aggregates={value}*/}
      {/*        onActivityClick={({ activityId }) => {*/}
      {/*          navigate(`/dashboard/activities/${activityId}`);*/}
      {/*        }}*/}
      {/*      />*/}
      {/*    </div>*/}
      {/*  );*/}
      {/*})}*/}
      {(aggregates?.length ?? 0) === 0 && (
        <Empty
          title="No Activities Tracked"
          description="No activities were tracked for this session yet."
        />
      )}
    </div>
  );
}
type GroupKey = 'notFound' | 'noMatch' | string;
type GroupTuple = [GroupKey, Aggregate[]];

function groupAggregates(
  aggregates: Aggregate[],
  characterId: string,
): GroupTuple[] {
  // First, create the grouped object as before
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
        case 'noMatch':
        case 'notFound':
          if (state[link.confidenceLevel]) {
            state[link.confidenceLevel].push(current);
          } else {
            state[link.confidenceLevel] = [current];
          }
          break;
      }
      return state;
    },
    {} as Record<GroupKey, Aggregate[]>,
  );

  // Convert to array of tuples and sort
  return Object.entries(grouped).sort((a, b) => {
    // Helper function to get sort priority
    const getPriority = (key: string): number => {
      if (key === 'notFound') return 3;
      if (key === 'noMatch') return 2;
      return 1;
    };

    const priorityA = getPriority(a[0]);
    const priorityB = getPriority(b[0]);

    if (priorityA === priorityB) {
      return b[1].length - a[1].length;
    }

    return priorityA - priorityB;
  });
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
  }
  return (
    <div className="text-sm uppercase tracking-wide text-muted-foreground">
      {label}
      {modeLabel && <span>{' - ' + modeLabel}</span>}
    </div>
  );
}
