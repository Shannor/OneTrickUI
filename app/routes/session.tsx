import { format } from 'date-fns';
import { Percent, Tally5, Target } from 'lucide-react';
import { useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import {
  type Aggregate,
  type CharacterSnapshot,
  type InstancePerformance,
  getSession,
  getSessionAggregates,
} from '~/api';
import { calculatePercentage } from '~/calculations/precision';
import { Empty } from '~/components/empty';
import { Badge } from '~/components/ui/badge';
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

  const isCurrent = session.status === 'pending';
  const group = groupAggregates(aggregates, session.characterId);

  return (
    <div>
      <div className="flex flex-col items-start gap-4 border-b pb-2">
        {isCurrent && <Badge className="animate-pulse">Active</Badge>}
        <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
          {session.name}
        </h2>
        <div className="text-sm text-muted-foreground">
          {format(session.startedAt, 'MM/dd/yyyy - p')}
          {session.completedAt
            ? `- ${format(session.completedAt, 'MM/dd/yyyy - p')}`
            : ''}
        </div>
      </div>
      {group.map(([key, value]) => {
        const snapshot = snapshots[key];
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
          <div key={key} className="flex flex-col gap-4 border-b p-4">
            <div className="flex flex-col">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                {title}
              </h4>
            </div>
            <Loadout performances={performances} snapshot={snapshot} />
            <Performance performances={performances} />
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

const Kinetic = 1498876634;
const Energy = 2465295065;
const Power = 953998645;
const SubClass = 3284755031;
interface LoadoutProps {
  snapshot?: CharacterSnapshot;
  performances: InstancePerformance[];
}

interface Stats {
  precisionKills: number;
  kills: number;
}
const PrecisionKills = 'uniqueWeaponPrecisionKills';
const UniqueKills = 'uniqueWeaponKills';
function Loadout({ snapshot, performances }: LoadoutProps) {
  if (!snapshot) {
    return null;
  }
  const weaponStats = performances.reduce(
    (state, currentValue) => {
      Object.entries(currentValue.weapons).forEach(([key, weapon]) => {
        if (!weapon.stats) {
          return;
        }
        if (state[key]) {
          state[key].kills += weapon.stats[UniqueKills].basic.value ?? 0;
          state[key].precisionKills +=
            weapon.stats[PrecisionKills].basic.value ?? 0;
        } else {
          state[key] = {
            precisionKills: weapon.stats[PrecisionKills].basic.value ?? 0,
            kills: weapon.stats[UniqueKills].basic.value ?? 0,
          };
        }
      });
      return state;
    },
    {} as Record<string, Stats>,
  );

  const kinetic = snapshot.loadout[Kinetic];
  const energy = snapshot.loadout[Energy];
  const power = snapshot.loadout[Power];
  const subclass = snapshot.loadout[SubClass];
  const ordered = [kinetic, energy, power].filter(Boolean);

  return (
    <div>
      <div className="flex flex-row gap-4">
        Class : {subclass?.name ?? 'Unknown'}
      </div>
      {ordered.map((item) => {
        const kills = weaponStats[item.itemHash]?.kills ?? 0;
        const precision = weaponStats[item.itemHash]?.precisionKills ?? 0;
        console.log(item.details);
        return (
          <div className="flex flex-row gap-4">
            <div className="flex flex-col">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                {item.name}
              </h4>
              <div className="flex flex-row gap-4 text-sm text-muted-foreground">
                <div>
                  <Tally5 />
                  <div>Kills: {kills}</div>
                </div>
                <div>
                  <Target />
                  <div>Precision:{precision}</div>
                </div>
                <div>
                  <Percent />
                  <div>
                    Percentage: {calculatePercentage(precision, kills)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
