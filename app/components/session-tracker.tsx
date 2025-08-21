import React from 'react';
import type { Session } from '~/api';
import { Label } from '~/components/label';
import { Ping } from '~/components/ping';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { Well } from '~/components/well';
import { useFiveMinuteCountdown } from '~/hooks/use-five-minute-countdown';

interface SessionTrackerProps {
  session?: Session;
}
const SessionTracker: React.FC<SessionTrackerProps> = ({ session }) => {
  const { formatted } = useFiveMinuteCountdown();
  if (!session) return null;
  if (session.status === 'complete') {
    return null;
  }
  return (
    <Well>
      <div className="flex flex-row items-center justify-between">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          {session.name}
        </h4>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex flex-row items-center gap-2">
              <Ping />
              <Label> {formatted}</Label>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            The session will automatically update every 5 minutes.
          </TooltipContent>
        </Tooltip>
      </div>
      <div>Matches: {session.aggregateIds?.length ?? 0}</div>
    </Well>
  );
};

export default SessionTracker;
