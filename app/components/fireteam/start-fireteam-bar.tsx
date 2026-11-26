import { Play, SwordsIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { LoadingButton } from '~/components/loading-button';
import { cn } from '~/lib/utils';

import { useFireteam } from './fireteam-context';

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

export function TrackCompToggle() {
  const { trackComp, setTrackComp, isBulkSubmitting, readyCount } =
    useFireteam();
  const isDisabled = isBulkSubmitting || readyCount === 0;

  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
        trackComp
          ? 'border-primary bg-primary/5 text-foreground'
          : 'border-border/80 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground',
        isDisabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="checkbox"
        name="trackComp"
        checked={trackComp}
        disabled={isDisabled}
        onChange={(e) => setTrackComp(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
      />
      <SwordsIcon className="h-4 w-4 shrink-0 text-primary" />
      <span>Track Competitive Score</span>
    </label>
  );
}

export function StartFireteamButton() {
  const { selectedTargets, isBulkSubmitting, submitBulkStart } = useFireteam();
  const selectedCount = selectedTargets.length;
  const isDisabled = selectedCount === 0 || isBulkSubmitting;

  return (
    <LoadingButton
      type="button"
      variant="default"
      onClick={submitBulkStart}
      disabled={isDisabled}
      isLoading={isBulkSubmitting}
      className="w-full justify-center gap-2 font-medium sm:w-auto"
    >
      <Play className="h-4 w-4" />
      <span>
        {selectedCount > 0
          ? `Start Fireteam (${selectedCount})`
          : 'Start Fireteam'}
      </span>
    </LoadingButton>
  );
}

export interface StartFireteamBarProps {
  children?: ReactNode;
}

export function StartFireteamBar({ children }: StartFireteamBarProps) {
  const { selectedTargets, readyCount, activeSelectedCount } = useFireteam();
  const statusText = getBulkStartStatusText({
    readyCount,
    selectedCount: selectedTargets.length,
    activeCount: activeSelectedCount,
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
          <TrackCompToggle />
          <StartFireteamButton />
        </div>
      </div>

      {children}
    </section>
  );
}
