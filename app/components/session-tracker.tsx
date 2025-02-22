import { format } from 'date-fns';
import React from 'react';
import type { Session } from '~/api';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';

interface SessionTrackerProps {
  session?: Session;
}
const SessionTracker: React.FC<SessionTrackerProps> = ({ session }) => {
  if (!session) return null;
  return (
    <div className="absolute right-0 top-1 z-40 cursor-default">
      <Tooltip>
        <TooltipTrigger className="cursor-default">
          <div className="flex flex-row gap-4 rounded-lg bg-indigo-700/30 px-4 py-2">
            <div>Session Update - 2:34 </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div>{session.name}</div>
          <div>
            Started At: {format(new Date(session.startedAt), 'MM/dd/yyyy - p')}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SessionTracker;
