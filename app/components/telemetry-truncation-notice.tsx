import { Info } from 'lucide-react';

export interface TelemetryTruncationNoticeProps {
  shownCount: number;
  totalCount: number;
}

export function TelemetryTruncationNotice({
  shownCount,
  totalCount,
}: TelemetryTruncationNoticeProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-l-2 border-muted-foreground/40 pl-3 text-xs text-muted-foreground md:rounded-lg md:border md:border-border/60 md:bg-muted/40 md:px-3.5 md:py-2"
    >
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Showing most recent {shownCount.toLocaleString('en-US')} of{' '}
        {totalCount.toLocaleString('en-US')} tracked matches.
      </span>
    </div>
  );
}
