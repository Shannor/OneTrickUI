import { SquareArrowOutUpRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { getRequestLogger } from '~/.server/logger';
import { getActivity, getSession } from '~/api';
import { Empty } from '~/components/empty';
import { FormattedDate } from '~/components/formatted-date';
import { ActivityMeta, MatchScoreboard } from '~/components/match-scoreboard';
import { TeamScore } from '~/components/team-score';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  buildMatchScoreboardViewModel,
  countTrackedParticipants,
} from '~/lib/match-scoreboard';
import { isEmptyObject } from '~/lib/utils';

import type { Route } from './+types/activity';

export async function loader({ params, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { instanceId, sessionId } = params;
  log.set({
    route: 'routes/activity',
    activity: { instanceId },
    ...(sessionId ? { session: { id: sessionId } } : {}),
  });

  const [res, sessionRes] = await Promise.all([
    getActivity({
      path: { activityId: instanceId },
    }),
    sessionId
      ? getSession({
          path: { sessionId },
        }).catch((err: unknown) => ({ data: undefined, error: err }))
      : Promise.resolve(undefined),
  ]);

  const session = sessionRes?.data;

  if (sessionId) {
    log.set({
      session: {
        id: sessionId,
        found: Boolean(session),
        ...(sessionRes?.error ? { loadFailed: true } : {}),
      },
    });
  }

  if (res.error) {
    log.error('Failed to fetch activity in loader', {
      activity: { instanceId, error: res.error },
    });
    return {
      activityDetails: undefined,
      session,
      error: 'Failed to load activity',
    };
  }

  if (!res.data || isEmptyObject(res.data)) {
    log.set({ activity: { instanceId, found: false } });
    return {
      activityDetails: undefined,
      session,
      error: 'Activity Not Found',
    };
  }

  const { participantCount, trackedLoadoutCount, trackedSessionCount } =
    countTrackedParticipants(
      res.data.participants ?? [],
      res.data.snapshots ?? {},
    );
  log.set({
    activity: {
      instanceId,
      found: true,
      participantCount,
      trackedLoadoutCount,
      trackedSessionCount,
    },
  });

  return { activityDetails: res.data, session, error: undefined };
}

const DESTINY_TRACKER_PGCR_URL = 'https://destinytracker.com/destiny-2/pgcr';
const CRUCIBLE_REPORT_PGCR_URL = 'https://crucible.report/pgcr';

export function Activity({ loaderData, params }: Route.ComponentProps) {
  const { activityDetails, error } = loaderData;
  const { characterId, id, instanceId, sessionId } = params;
  const backHref = sessionId
    ? `/profile/${id}/c/${characterId}/sessions/${sessionId}`
    : `/profile/${id}/c/${characterId}/sessions`;

  const viewModel = useMemo(
    () =>
      buildMatchScoreboardViewModel({
        participants: activityDetails?.participants ?? [],
        teams: activityDetails?.teams ?? [],
        snapshots: activityDetails?.snapshots ?? {},
      }),
    [
      activityDetails?.participants,
      activityDetails?.teams,
      activityDetails?.snapshots,
    ],
  );

  if (!activityDetails || error) {
    return (
      <div className="flex flex-col gap-4">
        <ActivityMeta />
        <Empty
          title="No Activity Found"
          description="We couldn't find this activity report. It may still be processing or no longer exists."
        >
          <Button asChild variant="outline">
            <Link to={backHref}>
              {sessionId ? 'Back to Session' : 'Back to Sessions'}
            </Link>
          </Button>
        </Empty>
      </div>
    );
  }

  const { activity, teams } = activityDetails;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <ActivityMeta
        activity={activity}
        userId={id}
        characterId={characterId}
        instanceId={instanceId}
      />

      <Card className="overflow-hidden border">
        <div className="relative min-h-[11rem] w-full sm:min-h-[14rem]">
          <img
            src={activity.imageUrl}
            alt="activity background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/40" />
          <CardHeader className="relative z-10 flex flex-col gap-4 p-4 text-white sm:gap-6 md:p-6">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                {activity.activityIcon && (
                  <img
                    src={activity.activityIcon}
                    className="h-10 w-10 shrink-0 rounded-lg bg-black/60 object-contain p-1 ring-1 ring-white/20 sm:h-12 sm:w-12"
                    alt="mode icon"
                  />
                )}
                <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
                  <CardTitle className="text-xl font-black tracking-tight drop-shadow-md sm:text-3xl">
                    {activity.location}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-neutral-200 drop-shadow sm:text-sm">
                    {activity.activity}
                    {activity.mode ? ` • ${activity.mode}` : ''}
                  </CardDescription>
                </div>
              </div>

              <div className="self-start sm:self-auto">
                <FormattedDate
                  date={activity.period}
                  className="inline-block rounded-md bg-black/50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-200 ring-1 ring-white/20 backdrop-blur-sm"
                />
              </div>
            </div>

            <TeamScore teams={teams} />

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center sm:gap-3">
              <a
                href={`${DESTINY_TRACKER_PGCR_URL}/${activity.instanceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/20 sm:w-auto sm:gap-2 sm:px-4"
              >
                <span className="truncate">Destiny Tracker</span>
                <SquareArrowOutUpRight className="h-3.5 w-3.5 shrink-0 text-blue-300" />
              </a>

              <a
                href={`${CRUCIBLE_REPORT_PGCR_URL}/${activity.instanceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/20 sm:w-auto sm:gap-2 sm:px-4"
              >
                <span className="truncate">Crucible Report</span>
                <SquareArrowOutUpRight className="h-3.5 w-3.5 shrink-0 text-blue-300" />
              </a>
            </div>
          </CardHeader>
        </div>
      </Card>

      {viewModel.counts.participantCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-lg font-medium">
            No participants found for this activity.
          </p>
          <Button asChild variant="outline">
            <Link to={backHref}>
              {sessionId ? 'Back to Session' : 'View Sessions'}
            </Link>
          </Button>
        </div>
      ) : (
        <MatchScoreboard key={activity.instanceId} viewModel={viewModel} />
      )}
    </div>
  );
}

export default Activity;
