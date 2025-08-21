import React from 'react';
import type { Session } from '~/api';
import { Well } from '~/components/well';

interface SessionTrackerProps {
  session?: Session;
}
const SessionTracker: React.FC<SessionTrackerProps> = ({ session }) => {
  if (!session) return null;
  if (session.status === 'complete') {
    return null;
  }
  return (
    <Well>
      <div>{session.name}</div>
      <div>Matches: {session.aggregateIds?.length ?? 0}</div>
    </Well>
  );
};

export default SessionTracker;
