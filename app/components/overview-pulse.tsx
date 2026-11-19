import {
  ActivityIcon,
  ArrowRightIcon,
  CrosshairIcon,
  Gamepad2Icon,
  PlusIcon,
  RadioIcon,
  StopCircleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TrophyIcon,
  UsersRoundIcon,
} from 'lucide-react';
import { Link, useFetcher } from 'react-router';
import type { Character, Profile, Session } from '~/api';
import {
  formatCompPointDelta,
  getCompPointDelta,
} from '~/components/comp-tracking';
import { LoadingButton } from '~/components/loading-button';
import { StartSessionDialog } from '~/components/start-session-dialog';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export interface RecentFormStats {
  sessionsCount: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  latestWinRateDelta: number | null;
  avgKd: number | null;
  latestKdDelta: number | null;
}

function getSessionWinRatePercentage(session?: Session): number | null {
  const summary = session?.summary;
  if (!summary) return null;

  const matchCount =
    summary.totalMatches ?? session?.aggregateIds?.length ?? 0;

  if (summary.winRate != null) {
    return summary.winRate <= 1
      ? Math.round(summary.winRate * 100)
      : Math.round(summary.winRate);
  }

  if (summary.wins != null || summary.losses != null) {
    const sessionWins = summary.wins ?? 0;
    const sessionLosses =
      summary.losses ??
      (matchCount > sessionWins ? matchCount - sessionWins : 0);
    const totalWithRecord = sessionWins + sessionLosses;
    if (totalWithRecord > 0) {
      return Math.round((sessionWins / totalWithRecord) * 100);
    }
  }

  return null;
}

export function computeRecentFormStats(sessions: Session[]): RecentFormStats {
  const sessionsCount = sessions.length;
  let totalMatches = 0;
  let wins = 0;
  let losses = 0;
  let matchesWithRecord = 0;
  let weightedKdSum = 0;
  let kdWeightTotal = 0;

  const sessionKds: number[] = [];
  const sessionWinRates: number[] = [];

  for (const session of sessions) {
    const summary = session.summary;
    const matchCount =
      summary?.totalMatches ?? session.aggregateIds?.length ?? 0;
    totalMatches += matchCount;

    if (summary) {
      const sessionWins = summary.wins ?? 0;
      const sessionLosses =
        summary.losses ??
        (matchCount > sessionWins ? matchCount - sessionWins : 0);

      if (summary.wins != null || summary.losses != null) {
        wins += sessionWins;
        losses += sessionLosses;
        matchesWithRecord += sessionWins + sessionLosses;
      } else if (summary.winRate != null && matchCount > 0) {
        const normalizedRate =
          summary.winRate <= 1 ? summary.winRate : summary.winRate / 100;
        const estimatedWins = Math.round(normalizedRate * matchCount);
        wins += estimatedWins;
        losses += Math.max(0, matchCount - estimatedWins);
        matchesWithRecord += matchCount;
      }

      const sessionWinRate = getSessionWinRatePercentage(session);
      if (sessionWinRate != null) {
        sessionWinRates.push(sessionWinRate);
      }

      if (summary.kdRatio != null) {
        const weight = Math.max(1, matchCount);
        weightedKdSum += summary.kdRatio * weight;
        kdWeightTotal += weight;
        sessionKds.push(summary.kdRatio);
      }
    }
  }

  const winRate =
    matchesWithRecord > 0 ? Math.round((wins / matchesWithRecord) * 100) : null;
  const avgKd =
    kdWeightTotal > 0
      ? Number((weightedKdSum / kdWeightTotal).toFixed(2))
      : null;

  let latestWinRateDelta: number | null = null;
  const latestWinRate = getSessionWinRatePercentage(sessions[0]);
  if (latestWinRate != null && sessionWinRates.length >= 2) {
    const previousWinRates = sessionWinRates.slice(1);
    const previousWinRateAvg =
      previousWinRates.reduce((sum, val) => sum + val, 0) /
      previousWinRates.length;
    latestWinRateDelta = Math.round(latestWinRate - previousWinRateAvg);
  }

  let latestKdDelta: number | null = null;
  const latestKd = sessions[0]?.summary?.kdRatio;
  if (latestKd != null && sessionKds.length >= 2) {
    const previousKds = sessionKds.slice(1);
    const previousAvg =
      previousKds.reduce((sum, val) => sum + val, 0) / previousKds.length;
    latestKdDelta = Number((latestKd - previousAvg).toFixed(2));
  }

  return {
    sessionsCount,
    totalMatches,
    wins,
    losses,
    winRate,
    latestWinRateDelta,
    avgKd,
    latestKdDelta,
  };
}

export interface DirectSessionStartFormProps {
  characterId?: string;
  userId?: string;
  label?: string;
  className?: string;
}

export function DirectSessionStartForm({
  characterId,
  userId,
  label = 'Start Session',
  className,
}: DirectSessionStartFormProps) {
  return (
    <StartSessionDialog
      characterId={characterId}
      userId={userId}
      triggerLabel={label}
      triggerIcon={<PlusIcon className="h-4 w-4" />}
      triggerClassName={className}
    />
  );
}

export interface DirectSessionEndFormProps {
  characterId?: string;
  sessionId?: string;
  className?: string;
}

export function DirectSessionEndForm({
  characterId,
  sessionId,
  className,
}: DirectSessionEndFormProps) {
  const { state, Form } = useFetcher();
  const isSubmitting = state === 'submitting';
  const isDisabled = !characterId || !sessionId || isSubmitting;

  return (
    <Form
      method="post"
      action="/action/end-session"
      className={cn('w-full sm:w-auto', className)}
    >
      <input type="hidden" name="characterId" value={characterId ?? ''} />
      <input type="hidden" name="sessionId" value={sessionId ?? ''} />
      <LoadingButton
        type="submit"
        variant="outline"
        disabled={isDisabled}
        isLoading={isSubmitting}
        className="w-full justify-center gap-2 sm:w-auto"
      >
        <StopCircleIcon className="h-4 w-4" />
        <span>Stop Session</span>
      </LoadingButton>
    </Form>
  );
}

export interface OverviewHeaderProps {
  profile: Profile;
  character?: Character;
  isOwner: boolean;
  activeSession?: Session;
  hasSessions?: boolean;
  characterId?: string;
  userId?: string;
}

export function OverviewHeader({
  profile,
  character,
  isOwner,
  activeSession,
  hasSessions = true,
  characterId,
  userId,
}: OverviewHeaderProps) {
  const resolvedCharacterId = characterId ?? character?.id;
  const resolvedUserId = userId ?? profile.id;

  return (
    <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight sm:text-3xl">
            {isOwner ? 'Welcome' : 'Viewing'} {profile.displayName}!
          </h2>
          {activeSession && (
            <Badge className="animate-pulse gap-1.5 bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">
              <RadioIcon className="h-3 w-3" />
              <span>Live Session Active</span>
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {activeSession
            ? 'Crucible matches and loadout swaps are actively being tracked for this Guardian.'
            : isOwner
              ? 'Start a live tracking session before queueing into the Crucible, or inspect your recent performance.'
              : `Inspecting ${profile.displayName}'s ${character?.class ?? 'Guardian'} Crucible sessions and top loadouts.`}
        </p>
      </div>

      {isOwner && (
        <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
          {activeSession ? (
            <>
              <Button asChild variant="default" className="gap-2">
                <Link to={`sessions/${activeSession.id}`}>
                  <RadioIcon className="h-4 w-4" />
                  <span>Open Live Session</span>
                </Link>
              </Button>
              <DirectSessionEndForm
                characterId={resolvedCharacterId}
                sessionId={activeSession.id}
              />
            </>
          ) : (
            <>
              {hasSessions && (
                <DirectSessionStartForm
                  characterId={resolvedCharacterId}
                  userId={resolvedUserId}
                />
              )}
              <Button asChild variant="outline" className="gap-2">
                <Link to="fireteam">
                  <UsersRoundIcon className="h-4 w-4 text-primary" />
                  <span>Fireteam</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export interface RecentFormPulseProps {
  sessions: Session[];
  onSelectSession: (sessionId: string) => void;
}

export function RecentFormPulse({
  sessions,
  onSelectSession,
}: RecentFormPulseProps) {
  if (sessions.length === 0) {
    return null;
  }

  const stats = computeRecentFormStats(sessions);
  const recentSessions = sessions.slice(0, 5);
  const isPositiveWinRate = (stats.winRate ?? 0) >= 50;

  return (
    <section
      aria-label="Recent Form"
      className="flex w-full min-w-0 flex-col gap-5 border-b border-border/70 pb-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground sm:text-sm">
            Recent Form ({stats.sessionsCount}{' '}
            {stats.sessionsCount === 1 ? 'Session' : 'Sessions'})
          </h3>
        </div>
        <Link
          to="sessions"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline sm:text-sm"
        >
          <span>All session history</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 md:divide-x md:divide-border/60">
        <div className="flex min-w-0 flex-col gap-1 md:pr-6">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Gamepad2Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
            Recent Matches
          </span>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="font-heading text-2xl font-extrabold tracking-wide text-foreground sm:text-3xl">
              {stats.totalMatches}
            </span>
            {(stats.wins > 0 || stats.losses > 0) && (
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                ({stats.wins}W - {stats.losses}L)
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1 md:px-6">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TrophyIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
            Recent Win Rate
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-heading text-2xl font-extrabold tracking-wide text-foreground sm:text-3xl">
              {stats.winRate == null ? '--' : `${stats.winRate}%`}
            </span>
            {stats.latestWinRateDelta != null &&
            stats.latestWinRateDelta !== 0 ? (
              <TrendDeltaIndicator
                delta={stats.latestWinRateDelta}
                formattedDelta={
                  stats.latestWinRateDelta > 0
                    ? `+${stats.latestWinRateDelta}%`
                    : `${stats.latestWinRateDelta}%`
                }
              />
            ) : stats.winRate == null ? null : (
              <span
                className={cn(
                  'text-xs font-semibold sm:text-sm',
                  isPositiveWinRate
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400',
                )}
              >
                {isPositiveWinRate ? 'Positive' : 'Negative'}
              </span>
            )}
          </div>
        </div>

        <div className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1 md:pl-6">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CrosshairIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
            Avg K / D
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-heading text-2xl font-extrabold tracking-wide text-foreground sm:text-3xl">
              {stats.avgKd == null ? '--' : stats.avgKd.toFixed(2)}
            </span>
            {stats.latestKdDelta != null && stats.latestKdDelta !== 0 && (
              <TrendDeltaIndicator
                delta={stats.latestKdDelta}
                formattedDelta={
                  stats.latestKdDelta > 0
                    ? `+${stats.latestKdDelta.toFixed(2)}`
                    : stats.latestKdDelta.toFixed(2)
                }
              />
            )}
          </div>
        </div>
      </div>

      {recentSessions.length > 0 && (
        <PreviousSessionsStrip
          sessions={recentSessions}
          onSelectSession={onSelectSession}
        />
      )}
    </section>
  );
}

function TrendDeltaIndicator({
  delta,
  formattedDelta,
}: {
  delta: number;
  formattedDelta: string;
}) {
  const isPositive = delta > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold sm:text-sm',
        isPositive
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-amber-600 dark:text-amber-400',
      )}
    >
      {isPositive ? (
        <TrendingUpIcon className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <TrendingDownIcon className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>{formattedDelta} latest</span>
    </span>
  );
}

function PreviousSessionsStrip({
  sessions,
  onSelectSession,
}: {
  sessions: Session[];
  onSelectSession: (sessionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Previous Sessions:
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {sessions.map((session) => {
          const matches =
            session.summary?.totalMatches ?? session.aggregateIds?.length ?? 0;
          const matchLabel = matches === 1 ? '1 Match' : `${matches} Matches`;
          const kd = session.summary?.kdRatio;
          const compDelta = getCompPointDelta(session.compTracking);
          return (
            <Button
              key={session.id}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onSelectSession(session.id)}
              className="h-7 max-w-full gap-1.5 rounded-full px-3 text-xs font-medium"
            >
              <span className="max-w-[140px] truncate font-semibold">
                {session.name || 'Session'}
              </span>
              <span className="text-muted-foreground">
                · {matchLabel}
                {kd == null ? '' : ` · ${kd.toFixed(2)} KD`}
              </span>
              {compDelta != null && (
                <span
                  className={cn(
                    'font-semibold',
                    compDelta > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : compDelta < 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground',
                  )}
                >
                  · {formatCompPointDelta(compDelta)}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
