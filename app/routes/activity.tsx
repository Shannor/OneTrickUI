import { SquareArrowOutUpRight } from 'lucide-react';
import React from 'react';
import { Link, data } from 'react-router';
import { getActivity } from '~/api';
import { PlayerCard } from '~/components/player-card';
import { TeamScore } from '~/components/team-score';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { isEmptyObject } from '~/lib/utils';

import type { Route } from './+types/activity';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { instanceId } = params;
  const url = new URL(request.url);

  const res = await getActivity({
    path: { activityId: instanceId },
  });

  if (!res.data || isEmptyObject(res.data)) {
    throw data('Record Not Found', { status: 404 });
  }
  return { activityDetails: res.data };
}

const destinyTrackerUrl = 'https://destinytracker.com/destiny-2/pgcr';
const crucibleReportUrl = 'https://crucible.report/pgcr';

export default function Activity({ loaderData, params }: Route.ComponentProps) {
  const {
    activityDetails: { activity, aggregate, teams, snapshots, users },
  } = loaderData;

  const { characterId, id } = params;
  const allPerformances = Object.entries(aggregate?.performance ?? {}).filter(
    ([characterId]) => {
      const link = aggregate?.snapshotLinks[characterId];
      return (
        link &&
        link.confidenceLevel !== 'noMatch' &&
        link.confidenceLevel !== 'notFound'
      );
    },
  );

  return (
    <div className="flex flex-col gap-4">
      <title>{`${activity.location} - ${activity.activity}${activity.mode ? ` • ${activity.mode}` : ''}`}</title>
      <meta property="og:title" content={`${activity.location} - ${activity.activity}${activity.mode ? ` • ${activity.mode}` : ''}`} />
      <meta name="description" content={`Post-game report for ${activity.activity}${activity.mode ? ` in ${activity.mode}` : ''} at ${activity.location}.`} />
      <Card>
        <div className="relative">
          <img
            src={activity.imageUrl}
            alt="activity background"
            className="h-40 w-full rounded-t-lg object-cover"
          />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-black/70 to-black/20" />
          <CardHeader className="relative z-10 rounded-lg text-white">
            <div className="flex items-center gap-4">
              {activity.activityIcon && (
                <img
                  src={activity.activityIcon}
                  className="h-12 w-12 rounded-lg bg-black/50 object-cover"
                  alt="mode icon"
                />
              )}
              <div className="flex flex-col">
                <CardTitle className="text-2xl">{activity.location}</CardTitle>
                <CardDescription className="text-neutral-200">
                  {activity.activity}
                  {activity.mode ? ` • ${activity.mode}` : ''}
                </CardDescription>
              </div>
              <div className="ml-auto">
                <span className="rounded bg-white/10 px-2 py-1 text-xs uppercase tracking-wide">
                  {new Date(activity.period as any).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <TeamScore teams={teams} />
            </div>
            <div className="mt-2 flex flex-row gap-4">
              <div className="flex flex-row items-center gap-2 align-middle">
                <a
                  className="text-blue-300 underline-offset-2 hover:underline"
                  href={`${destinyTrackerUrl}/${activity.instanceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Destiny Tracker
                </a>
                <SquareArrowOutUpRight className="h-4 w-4" />
              </div>
              <div className="flex flex-row items-center gap-2">
                <a
                  className="text-blue-300 underline-offset-2 hover:underline"
                  href={`${crucibleReportUrl}/${activity.instanceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Crucible Report
                </a>
                <SquareArrowOutUpRight className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
        </div>
      </Card>
      {/*<SnapshotLinkDetails link={link} />*/}

      {/* Players (Stats + Weapons + Snapshot) */}
      <div className="flex flex-col gap-4">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Players
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {allPerformances.map(([charId, perf]) => {
            const link = aggregate?.snapshotLinks[charId];
            return (
              <div>
                {link && (
                  <div className="flex flex-row gap-4">
                    <Button asChild variant="ghost">
                      <Link
                        to={`/profile/${id}/c/${characterId}/sessions/${link.sessionId}`}
                      >
                        View Session
                      </Link>
                    </Button>
                    <Button asChild variant="ghost">
                      <Link
                        to={`/profile/${id}/c/${characterId}/loadouts/${link.snapshotId}`}
                      >
                        View Loadout
                      </Link>
                    </Button>
                  </div>
                )}
                <PlayerCard
                  key={charId}
                  performance={perf}
                  user={users[charId]}
                  snapshot={snapshots[charId]}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
