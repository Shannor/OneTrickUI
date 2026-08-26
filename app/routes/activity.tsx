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
      <Card className="overflow-hidden border">
        <div className="relative min-h-[14rem] w-full">
          <img
            src={activity.imageUrl}
            alt="activity background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/40" />
          <CardHeader className="relative z-10 flex flex-col gap-6 p-5 text-white md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3.5">
                {activity.activityIcon && (
                  <img
                    src={activity.activityIcon}
                    className="h-12 w-12 shrink-0 rounded-lg bg-black/60 object-contain p-1 ring-1 ring-white/20"
                    alt="mode icon"
                  />
                )}
                <div className="flex min-w-0 flex-col gap-1">
                  <CardTitle className="text-2xl font-black tracking-tight drop-shadow-md sm:text-3xl">
                    {activity.location}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-neutral-200 drop-shadow">
                    {activity.activity}
                    {activity.mode ? ` • ${activity.mode}` : ''}
                  </CardDescription>
                </div>
              </div>

              <div className="self-start sm:self-auto">
                <FormattedDate
                  date={activity.period as any}
                  className="inline-block rounded-md bg-black/50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-200 ring-1 ring-white/20 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="border-t border-white/15 pt-4">
              <TeamScore teams={teams} />
            </div>

            <div className="flex flex-col gap-2.5 border-t border-white/15 pt-4 sm:flex-row sm:items-center sm:gap-3">
              <a
                href={`${destinyTrackerUrl}/${activity.instanceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/20 sm:w-auto"
              >
                <span>View on Destiny Tracker</span>
                <SquareArrowOutUpRight className="h-3.5 w-3.5 text-blue-300" />
              </a>

              <a
                href={`${crucibleReportUrl}/${activity.instanceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/20 sm:w-auto"
              >
                <span>View on Crucible Report</span>
                <SquareArrowOutUpRight className="h-3.5 w-3.5 text-blue-300" />
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
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Players ({allPerformances.length})
            </h3>
            {allPerformances.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Click Expand Loadout on any player card to view weapons and gear
                breakdown.
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6">
            {allPerformances.map(([charId, perf], idx) => {
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
                  collapsible={true}
                  defaultOpen={idx === 0}
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
