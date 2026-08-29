import { Activity, Gamepad2, Play } from 'lucide-react';
import { Form, Link } from 'react-router';
import { LoadingButton } from '~/components/loading-button';
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
  const sessionPath =
    session?.id && characterId
      ? `/profile/${userId}/c/${characterId}/sessions/${session.id}`
      : `/profile/${userId}`;

  if (session?.status === 'pending') {
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
    <Form
      className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4"
      method="post"
      action="/action/start-session"
    >
      <input hidden name="characterId" value={characterId ?? ''} readOnly />
      <input hidden name="userId" value={userId} readOnly />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Session Status</span>
        <span className="font-medium text-muted-foreground">Inactive</span>
      </div>
      <LoadingButton
        type="submit"
        isLoading={isSubmitting}
        disabled={isSubmitting || !characterId}
        className="w-full gap-2 font-medium"
      >
        <Play className="h-4 w-4" />
        Start a Session
      </LoadingButton>
    </Form>
  );
}
