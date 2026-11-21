import { Activity, Gamepad2, Play, SwordsIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import type { CompTracking } from '~/api';
import { CompDivisionSnapshot } from '~/components/comp-tracking';
import { StartSessionDialog } from '~/components/start-session-dialog';
import { Badge } from '~/components/ui/badge';
import { buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export interface SessionData {
  id: string;
  name?: string;
  status?: 'pending' | 'complete';
  aggregateIds?: string[];
  userId: string;
  characterId: string;
  compTracking?: CompTracking;
}

interface MemberSessionStatusProps {
  session?: SessionData;
  userId: string;
  characterId?: string;
  isSubmitting?: boolean;
}

export function MemberSessionStatus({
  session,
  userId,
  characterId,
  isSubmitting = false,
}: MemberSessionStatusProps) {
  const location = useLocation();
  const sessionPath =
    session?.id && characterId
      ? `/profile/${userId}/c/${characterId}/sessions/${session.id}`
      : `/profile/${userId}`;

  if (session?.status === 'pending') {
    const compTracking = session.compTracking;
    return (
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Active Session
            </span>
          </div>
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground" />
            {session.aggregateIds?.length ?? 0}{' '}
            {session.aggregateIds?.length === 1 ? 'game' : 'games'}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{session.name || 'Current Session'}</span>
        </div>

        {compTracking?.enabled && (
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-primary">
              <SwordsIcon className="h-3.5 w-3.5 shrink-0" />
              <span>Comp</span>
            </span>
            {compTracking.start ? (
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

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Session Status</span>
        <span className="font-medium text-muted-foreground">Inactive</span>
      </div>
      <StartSessionDialog
        characterId={characterId}
        userId={userId}
        redirectTo={location.pathname}
        triggerLabel="Start a Session"
        triggerIcon={<Play className="h-4 w-4" />}
        triggerClassName="w-full sm:w-full gap-2 font-medium"
        disabled={isSubmitting || !characterId}
        isLoading={isSubmitting}
      />
    </div>
  );
}
