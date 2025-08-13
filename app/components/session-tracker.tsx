import React from 'react';
import { useSubmit } from 'react-router';
import type { Session } from '~/api';
import { Label } from '~/components/label';
import { Badge } from '~/components/ui/badge';
import { Well } from '~/components/well';
import { useCountdown } from '~/hooks/use-countdown';

interface SessionTrackerProps {
  session?: Session;
  membershipId?: string;
}
const FIVE_MINS = 300000;
const SessionTracker: React.FC<SessionTrackerProps> = ({
  session,
  membershipId,
}) => {
  const submit = useSubmit();
  const { reset, formatted } = useCountdown(
    FIVE_MINS,
    () => {
      if (session?.id && membershipId) {
        const data = new FormData();
        data.set('membershipId', membershipId);
        data.set('sessionId', session?.id);
        submit(data, {
          method: 'post',
          action: '/dashboard/action/session-check-in',
        })
          .then(() => reset())
          .catch(console.error);
      } else {
        console.error('Missing required data ');
      }
    },
    {
      persistKey: 'session-countdown',
      paused: session?.status === 'complete',
    },
  );

  if (!session) return null;
  if (session.status === 'complete') {
    return null;
  }
  return (
    <Well>
      <div className="flex flex-row items-center justify-between">
        <Label>Check-in </Label>
        <Badge variant="secondary" className="tex-sm">
          {formatted}
        </Badge>
      </div>
      <div>{session.name}</div>
      <div>Matches: {session.aggregateIds?.length ?? 0}</div>
    </Well>
  );
};

export default SessionTracker;
