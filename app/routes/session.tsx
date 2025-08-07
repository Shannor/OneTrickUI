import { format } from 'date-fns';
import { Share2 } from 'lucide-react';
import React, { useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import { getAuth } from '~/.server/auth';
import {
  type Aggregate,
  type CharacterSnapshot,
  getSession,
  getSessionAggregates,
} from '~/api';
import { Class } from '~/components/class';
import { Empty } from '~/components/empty';
import { Loadout } from '~/components/loadout';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { CollapsibleMaps } from '~/organisims/collapsible-maps';
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
      <div className="flex flex-col items-start gap-4 border-b p-4">
        {isCurrent && <Badge className="animate-pulse">Active</Badge>}
        <div className="flex flex-row gap-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            {session.name}
          </h2>
          <Tooltip open={Boolean(copyStatus)}>
            <TooltipContent>{copyStatus}</TooltipContent>
            <TooltipTrigger>
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
      {group.map(([key, value]) => {
        const snapshot: CharacterSnapshot | undefined = snapshots[key];
        let title = '';
        switch (key) {
          case 'notFound':
            title = 'No Found Snapshots';
            break;
          case 'noMatch':
            title = 'No Matching Weapons';
            break;
          default:
            title = snapshot?.name ?? 'Unknown';
        }
        const performances = value.map(
          (a) => a.performance[session.characterId],
        );

        return (
          <div key={key} className="flex flex-col gap-6 border-b p-4">
            <div className="flex flex-col">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                {title}
              </h4>
            </div>

            <Performance performances={performances} />
            <Class snapshot={snapshot} />
            <Loadout performances={performances} snapshot={snapshot} />
            <CollapsibleMaps
              aggregates={value}
              onActivityClick={({ activityId }) => {
                navigate(`/dashboard/activities/${activityId}`);
              }}
            />
          </div>
        );
      })}
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
