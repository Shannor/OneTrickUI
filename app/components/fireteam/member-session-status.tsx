import { formatDistanceToNow } from 'date-fns';
import { Activity, Clock, Gamepad2, Play, SwordsIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import type { FireteamSessionOutcome } from '~/api';
import { CompDivisionSnapshot } from '~/components/comp-tracking';
import { StartSessionDialog } from '~/components/start-session-dialog';
import { Badge } from '~/components/ui/badge';
import { buttonVariants } from '~/components/ui/button';
import type { MemberSessionData } from '~/lib/fireteam-sessions';
import { cn } from '~/lib/utils';

import { useFireteam, useFireteamMember } from './fireteam-context';

export type SessionData = MemberSessionData;

function formatStartedRelative(startedAt?: Date | string): string | undefined {
  if (!startedAt) return undefined;
  const date = startedAt instanceof Date ? startedAt : new Date(startedAt);
  if (Number.isNaN(date.getTime())) return undefined;
  return formatDistanceToNow(date, { addSuffix: true });
}

export interface ActiveMemberSessionProps {
  session: SessionData;
  bulkOutcome?: FireteamSessionOutcome;
  userId: string;
  characterId?: string;
}

export function ActiveMemberSession({
  session,
  bulkOutcome,
  userId,
  characterId,
}: ActiveMemberSessionProps) {
  const activeCharacterId = session.characterId || characterId;
  const sessionPath =
    session.id && activeCharacterId
      ? `/profile/${userId}/c/${activeCharacterId}/sessions/${session.id}`
      : `/profile/${userId}`;

  const compTracking = session.compTracking;
  const isCompTracking = Boolean(compTracking?.enabled || session.trackComp);
  const hasGameCount = session.aggregateIds !== undefined;
  const startedRelative = formatStartedRelative(session.startedAt);

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Active Session
          </span>
        </div>
        {hasGameCount ? (
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground" />
            {session.aggregateIds?.length ?? 0}{' '}
            {session.aggregateIds?.length === 1 ? 'game' : 'games'}
          </Badge>
        ) : (
          startedRelative && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Started {startedRelative}</span>
            </span>
          )
        )}
      </div>

      {(session.name || hasGameCount) && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{session.name || 'Current Session'}</span>
        </div>
      )}

      {bulkOutcome && (
        <div className="flex items-center gap-1.5 text-xs">
          <Badge
            variant="outline"
            className={cn(
              'text-[11px] font-medium',
              bulkOutcome === 'started'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
            )}
          >
            {bulkOutcome === 'started'
              ? 'Started via Fireteam'
              : 'Already Active (Skipped)'}
          </Badge>
        </div>
      )}

      {isCompTracking && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-primary">
            <SwordsIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Comp</span>
          </span>
          {compTracking?.start ? (
            <CompDivisionSnapshot
              snapshot={compTracking.start}
              className="text-xs sm:text-xs"
            />
          ) : (
            <span className="text-muted-foreground">Tracking</span>
          )}
        </div>
      )}

      <Link
        to={sessionPath}
        className={cn(
          buttonVariants({ variant: 'secondary', size: 'sm' }),
          'mt-1 w-full justify-center gap-1.5 font-medium',
        )}
      >
        View Live Session
      </Link>
    </div>
  );
}

export interface InactiveMemberSessionProps {
  otherActiveSession?: SessionData;
  otherActiveCharacterClass?: string;
  userId: string;
  characterId?: string;
  isSubmitting?: boolean;
}

export function InactiveMemberSession({
  otherActiveSession,
  otherActiveCharacterClass,
  userId,
  characterId,
  isSubmitting = false,
}: InactiveMemberSessionProps) {
  const location = useLocation();
  const otherSessionPath =
    otherActiveSession?.id && otherActiveSession.characterId
      ? `/profile/${userId}/c/${otherActiveSession.characterId}/sessions/${otherActiveSession.id}`
      : undefined;

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 pt-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Session Status</span>
        <span className="font-medium text-muted-foreground">Inactive</span>
      </div>

      {otherActiveSession && otherSessionPath && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs">
          <span className="flex min-w-0 items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate">
              Active session on{' '}
              {otherActiveCharacterClass || 'another Guardian'}
            </span>
          </span>
          <Link
            to={otherSessionPath}
            className="shrink-0 font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
          >
            View
          </Link>
        </div>
      )}

      <StartSessionDialog
        characterId={characterId}
        userId={userId}
        redirectTo={`${location.pathname}${location.search}`}
        triggerLabel="Start a Session"
        triggerIcon={<Play className="h-4 w-4" />}
        triggerClassName="w-full sm:w-full gap-2 font-medium"
        disabled={isSubmitting || !characterId}
        isLoading={isSubmitting}
      />
    </div>
  );
}

export function MemberSessionStatus() {
  const { isSubmitting } = useFireteam();
  const {
    memberKey,
    effectiveCharId,
    selectedActiveSession,
    otherActiveSession,
    otherActiveCharacterClass,
    bulkOutcome,
  } = useFireteamMember();

  if (selectedActiveSession?.status === 'pending') {
    return (
      <ActiveMemberSession
        session={selectedActiveSession}
        bulkOutcome={bulkOutcome}
        userId={memberKey}
        characterId={effectiveCharId}
      />
    );
  }

  return (
    <InactiveMemberSession
      otherActiveSession={otherActiveSession}
      otherActiveCharacterClass={otherActiveCharacterClass}
      userId={memberKey}
      characterId={effectiveCharId}
      isSubmitting={isSubmitting}
    />
  );
}
