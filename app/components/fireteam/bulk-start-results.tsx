import { AlertCircleIcon, CheckCircle2, Clock, X } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { formatBulkStartSummary } from '~/lib/fireteam-sessions';
import { cn } from '~/lib/utils';

import { useFireteam } from './fireteam-context';

export function BulkStartErrorAlert() {
  const { errorMessage } = useFireteam();

  if (!errorMessage) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
    >
      <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{errorMessage}</span>
    </div>
  );
}

export function BulkStartResultsSummary() {
  const { visibleResults, memberNames, dismissResults } = useFireteam();

  if (!visibleResults || visibleResults.length === 0) {
    return null;
  }

  const summary = formatBulkStartSummary(visibleResults);

  return (
    <div
      role="status"
      className="flex flex-col gap-2.5 border-t border-border/70 pt-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">
          {summary.title}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={dismissResults}
          aria-label="Dismiss results"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleResults.map((result) => {
          const displayName = memberNames[result.userId] || result.userId;
          const targetUserId = result.session.userId || result.userId;
          const targetCharId = result.session.characterId || result.characterId;
          const sessionPath = `/profile/${targetUserId}/c/${targetCharId}/sessions/${result.session.id}`;
          const isStarted = result.outcome === 'started';

          return (
            <Link
              key={`${result.userId}-${result.characterId}`}
              to={sessionPath}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                isStarted
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-300',
              )}
            >
              {isStarted ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Clock className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{displayName}</span>
              <span className="opacity-75">
                {isStarted ? 'Started' : 'Skipped (Active)'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
