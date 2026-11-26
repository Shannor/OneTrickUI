import {
  AlertCircleIcon,
  CheckCircle2,
  Clock,
  Play,
  SwordsIcon,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { FireteamSessionMemberTarget, FireteamSessionResult } from '~/api';
import { LoadingButton } from '~/components/loading-button';
import { Button } from '~/components/ui/button';
import { formatBulkStartSummary } from '~/lib/fireteam-sessions';
import { cn } from '~/lib/utils';

export interface BulkStartResultsSummaryProps {
  results: FireteamSessionResult[];
  memberNames: Record<string, string>;
  onDismiss?: () => void;
}

export function BulkStartResultsSummary({
  results,
  memberNames,
  onDismiss,
}: BulkStartResultsSummaryProps) {
  const summary = formatBulkStartSummary(results);

  return (
    <div
      role="status"
      className="flex flex-col gap-2.5 border-t border-border/70 pt-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">
          {summary.title}
        </span>
        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="Dismiss results"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {results.map((result) => {
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

interface BulkStartStatusTextInput {
  readyCount: number;
  selectedCount: number;
  activeCount: number;
}

export function getBulkStartStatusText({
  readyCount,
  selectedCount,
  activeCount,
}: BulkStartStatusTextInput): string {
  if (readyCount === 0) {
    return 'All teammates are actively tracking a session.';
  }
  if (selectedCount === 0) {
    return 'Select at least one inactive teammate below to start.';
  }
  if (activeCount > 0) {
    return `${selectedCount} selected to start · ${activeCount} already tracking (skipped)`;
  }
  const teammateLabel = selectedCount === 1 ? 'teammate' : 'teammates';
  return `${selectedCount} ${teammateLabel} ready to start`;
}

export interface StartFireteamBarProps {
  selectedTargets: FireteamSessionMemberTarget[];
  readyCount: number;
  activeCount: number;
  trackComp: boolean;
  onTrackCompChange: (trackComp: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage?: string;
  children?: ReactNode;
}

export function StartFireteamBar({
  selectedTargets,
  readyCount,
  activeCount,
  trackComp,
  onTrackCompChange,
  onSubmit,
  isSubmitting,
  errorMessage,
  children,
}: StartFireteamBarProps) {
  const selectedCount = selectedTargets.length;
  const isDisabled = selectedCount === 0 || isSubmitting;
  const statusText = getBulkStartStatusText({
    readyCount,
    selectedCount,
    activeCount,
  });

  return (
    <section
      aria-label="Bulk fireteam session controls"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-tight">
            Start Fireteam Sessions
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {statusText}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
          <label
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
              trackComp
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border/80 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground',
              (isSubmitting || readyCount === 0) &&
                'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="checkbox"
              name="trackComp"
              checked={trackComp}
              disabled={isSubmitting || readyCount === 0}
              onChange={(e) => onTrackCompChange(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
            />
            <SwordsIcon className="h-4 w-4 shrink-0 text-primary" />
            <span>Track Competitive Score</span>
          </label>

          <LoadingButton
            type="button"
            variant="default"
            onClick={onSubmit}
            disabled={isDisabled}
            isLoading={isSubmitting}
            className="w-full justify-center gap-2 font-medium sm:w-auto"
          >
            <Play className="h-4 w-4" />
            <span>
              {selectedCount > 0
                ? `Start Fireteam (${selectedCount})`
                : 'Start Fireteam'}
            </span>
          </LoadingButton>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {children}
    </section>
  );
}
