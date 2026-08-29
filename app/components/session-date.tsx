import { format, formatDistance } from 'date-fns';
import { ClockIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

export interface SessionDateProps {
  startedAt?: string | Date | null;
  completedAt?: string | Date | null;
  className?: string;
  iconClassName?: string;
}

export function SessionDate({
  startedAt,
  completedAt,
  className,
  iconClassName,
}: SessionDateProps) {
  const startDate = startedAt ? new Date(startedAt) : null;
  const endDate = completedAt ? new Date(completedAt) : null;

  if (!startDate) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:text-sm',
        className,
      )}
    >
      <span className="flex shrink-0 items-center gap-1">
        <ClockIcon
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground lg:h-4 lg:w-4',
            iconClassName,
          )}
        />
        {format(startDate, 'MMM d, yyyy')}
      </span>
      {startDate && endDate && (
        <span className="shrink-0 font-medium text-foreground">
          ({formatDistance(startDate, endDate)})
        </span>
      )}
    </div>
  );
}
