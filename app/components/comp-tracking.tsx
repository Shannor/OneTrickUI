import { ArrowRightIcon, SwordsIcon } from 'lucide-react';
import type { CompRankSnapshot, CompTracking } from '~/api';
import { DeltaBadge } from '~/components/delta-badge';
import { Badge } from '~/components/ui/badge';
import { cn, setBungieUrl } from '~/lib/utils';

export function formatCompPoints(points: number): string {
  return points.toLocaleString('en-US');
}

export function getCompPointDelta(
  compTracking?: CompTracking,
): number | undefined {
  if (!compTracking?.enabled) return undefined;
  if (compTracking.pointDelta != null) {
    return compTracking.pointDelta;
  }
  if (compTracking.start && compTracking.end) {
    return compTracking.end.points - compTracking.start.points;
  }
  return undefined;
}

export function formatCompPointDelta(delta: number): string {
  if (delta > 0) {
    return `+${formatCompPoints(delta)} pts`;
  }
  if (delta < 0) {
    return `-${formatCompPoints(Math.abs(delta))} pts`;
  }
  return '0 pts';
}

export type DivisionChangeStatus = 'promoted' | 'relegated' | 'changed' | null;

export function getDivisionChangeStatus(
  compTracking?: CompTracking,
): DivisionChangeStatus {
  const start = compTracking?.start;
  const end = compTracking?.end;
  if (
    !start?.divisionName ||
    !end?.divisionName ||
    start.divisionName === end.divisionName
  ) {
    return null;
  }

  if (
    start.stepIndex != null &&
    end.stepIndex != null &&
    start.stepIndex !== end.stepIndex
  ) {
    return end.stepIndex > start.stepIndex ? 'promoted' : 'relegated';
  }

  const delta = getCompPointDelta(compTracking);
  if (delta != null && delta > 0) return 'promoted';
  if (delta != null && delta < 0) return 'relegated';
  return 'changed';
}

export function CompDivisionSnapshot({
  snapshot,
  prefix,
  showPointsWithUnit = false,
  className,
}: {
  snapshot: CompRankSnapshot;
  prefix?: string;
  showPointsWithUnit?: boolean;
  className?: string;
}) {
  const iconUrl = setBungieUrl(snapshot.icon);
  const divisionLabel = snapshot.divisionName || 'Competitive';
  const formattedPoints = formatCompPoints(snapshot.points);

  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-foreground sm:text-sm',
        className,
      )}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={divisionLabel}
          className="h-4 w-4 shrink-0 rounded-sm object-contain sm:h-5 sm:w-5"
        />
      ) : (
        <SwordsIcon className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
      )}
      {showPointsWithUnit ? (
        <span className="truncate">
          {prefix ? `${prefix}: ` : ''}
          {divisionLabel} · {formattedPoints} pts
        </span>
      ) : (
        <span className="truncate">
          {prefix ? `${prefix}: ` : ''}
          {divisionLabel}{' '}
          <span className="font-normal text-muted-foreground">
            ({formattedPoints})
          </span>
        </span>
      )}
    </span>
  );
}

export function CompPointDeltaBadge({
  delta,
  className,
}: {
  delta: number;
  className?: string;
}) {
  return (
    <DeltaBadge
      delta={delta}
      label={formatCompPointDelta(delta)}
      className={cn('text-xs font-bold tracking-wide sm:text-sm', className)}
    />
  );
}

export function SessionCompTrackingBanner({
  compTracking,
  isPending,
  variant = 'card',
  className,
}: {
  compTracking?: CompTracking;
  isPending: boolean;
  variant?: 'card' | 'inline';
  className?: string;
}) {
  if (!compTracking?.enabled) {
    return null;
  }

  const { start, end } = compTracking;
  const delta = getCompPointDelta(compTracking);
  const divisionChange = getDivisionChangeStatus(compTracking);
  const isInline = variant === 'inline';

  if (isPending) {
    return (
      <div
        data-testid="session-comp-tracking-active"
        className={cn(
          'flex flex-wrap items-center justify-between gap-2',
          isInline
            ? 'border-b border-border/50 pb-3.5'
            : 'rounded-lg border border-primary/30 bg-primary/5 px-4 py-3',
          className,
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <SwordsIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Tracking Competitive</span>
          </span>
          {start && (
            <>
              <span className="text-muted-foreground">·</span>
              <CompDivisionSnapshot
                snapshot={start}
                prefix="Start"
                showPointsWithUnit
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="session-comp-tracking-complete"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3',
        isInline
          ? 'border-b border-border/50 pb-3.5'
          : 'rounded-lg border bg-card px-4 py-3',
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <SwordsIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>Competitive:</span>
        </span>

        {start && end ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <CompDivisionSnapshot snapshot={start} />
            <ArrowRightIcon
              aria-label="to"
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            />
            <CompDivisionSnapshot snapshot={end} />
          </div>
        ) : start ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CompDivisionSnapshot
              snapshot={start}
              prefix="Start"
              showPointsWithUnit
            />
            <span className="text-xs text-muted-foreground">
              · Finalizing rank...
            </span>
          </div>
        ) : end ? (
          <CompDivisionSnapshot
            snapshot={end}
            prefix="End"
            showPointsWithUnit
          />
        ) : (
          <span className="text-xs text-muted-foreground">
            Competitive score snapshot pending
          </span>
        )}

        {divisionChange === 'promoted' && (
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 px-2 py-0 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
          >
            Promoted
          </Badge>
        )}
        {divisionChange === 'relegated' && (
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 px-2 py-0 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400"
          >
            Relegated
          </Badge>
        )}
        {divisionChange === 'changed' && (
          <Badge
            variant="outline"
            className="px-2 py-0 text-[10px] font-semibold uppercase tracking-wider"
          >
            Division Changed
          </Badge>
        )}
      </div>

      {delta != null && <CompPointDeltaBadge delta={delta} />}
    </div>
  );
}
