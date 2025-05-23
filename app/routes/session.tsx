import { format } from 'date-fns';
import { Percent, Tally5, Target } from 'lucide-react';
import React from 'react';
import { useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import {
  type Aggregate,
  type CharacterSnapshot,
  type InstancePerformance,
  type ItemSnapshot,
  type UniqueStatValue,
  getSession,
  getSessionAggregates,
} from '~/api';
import { calculatePercentage } from '~/calculations/precision';
import { Class } from '~/components/class';
import { Empty } from '~/components/empty';
import { Loadout } from '~/components/loadout';
import { Stat } from '~/components/stat';
import { Badge } from '~/components/ui/badge';
import { Weapon } from '~/components/weapon';
import { CollapsibleMaps } from '~/organisims/collapsible-maps';
import { Performance } from '~/organisims/performance';

import type { Route } from '../../.react-router/types/app/routes/+types/session';

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
    headers: {
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });

  if (!res.data) {
    return { session: undefined, error: 'Session Not Found' };
  }
  const aggRes = await getSessionAggregates({
    path: {
      sessionId,
    },
    headers: {
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });
  if (!aggRes.data) {
    return {
      session: res.data,
      aggregates: [],
      snapshots: {},
      error: undefined,
    };
  }
  return {
    session: res.data,
    aggregates: aggRes.data.aggregates,
    snapshots: aggRes.data.snapshots,
    error: undefined,
  };
}

export default function Session() {
  const { session, error, aggregates, snapshots } =
    useLoaderData<typeof loader>();

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

  return (
    <div>
      <div className="flex flex-col items-start gap-4 border-b p-4">
        {isCurrent && <Badge className="animate-pulse">Active</Badge>}
        <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
          {session.name}
        </h2>
        <div className="text-sm text-muted-foreground">
          {format(session.startedAt, 'MM/dd/yyyy - p')}
          {session.completedAt
            ? ` - ${format(session.completedAt, 'MM/dd/yyyy - p')}`
            : ''}
        </div>
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
            <CollapsibleMaps aggregates={value} />
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
