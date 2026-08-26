import { SquareArrowOutUpRight } from 'lucide-react';
import { Link, data } from 'react-router';
import { getActivity } from '~/api';
import { FormattedDate } from '~/components/formatted-date';
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

export async function loader({ params }: Route.LoaderArgs) {
  const { instanceId } = params;

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

export function Activity({ loaderData, params }: Route.ComponentProps) {
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
      <meta
        property="og:title"
        content={`${activity.location} - ${activity.activity}${activity.mode ? ` • ${activity.mode}` : ''}`}
      />
      <meta
        name="description"
        content={`Post-game report for ${activity.activity}${activity.mode ? ` in ${activity.mode}` : ''} at ${activity.location}.`}
      />
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
                <FormattedDate
                  date={activity.period as any}
                  className="rounded bg-white/10 px-2 py-1 text-xs uppercase tracking-wide"
                />
              </div>
            </div>
            <div className="mt-3">
              <TeamScore teams={teams} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={`${destinyTrackerUrl}/${activity.instanceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
              >
                <span>Destiny Tracker</span>
                <SquareArrowOutUpRight className="h-3.5 w-3.5" />
              </a>

              <a
                href={`${crucibleReportUrl}/${activity.instanceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
              >
                <span>Crucible Report</span>
                <SquareArrowOutUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </CardHeader>
        </div>
      </Card>

      {allPerformances.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-lg font-medium">
            No performances found for this activity.
          </p>
          <Button asChild variant="outline">
            <Link to={`/profile/${id}/c/${characterId}/sessions`}>
              View Sessions
            </Link>
          </Button>
        </div>
      )}
      {/* Players (Stats + Weapons + Snapshot) */}
      {allPerformances.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Players
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {allPerformances.map(([charId, perf]) => {
              const link = aggregate?.snapshotLinks[charId];
              const user = users[charId];
              return (
                <PlayerCard
                  key={charId}
                  performance={perf}
                  user={user}
                  snapshot={snapshots[charId]}
                  characterId={charId}
                  sessionId={link?.sessionId}
                  snapshotId={link?.snapshotId}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Activity;
