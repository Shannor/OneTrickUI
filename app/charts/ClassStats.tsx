import { cn } from '~/lib/utils';

export type ClassStatData = {
  stat: string;
  value: number;
};

export interface ClassStatsProps {
  className?: string;
  data?: ClassStatData[];
  compact?: boolean;
}

export function ClassStats({
  className,
  data,
  compact = true,
}: ClassStatsProps) {
  if (!data || data.length === 0) return null;

  if (compact) {
    return (
      <div
        className={cn(
          'grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap sm:items-center sm:gap-1.5',
          className,
        )}
      >
        {data.map((it) => (
          <div
            key={it.stat}
            className="flex items-center justify-center gap-1 rounded bg-muted/70 px-2 py-0.5 text-[11px] font-medium sm:justify-start"
          >
            <span className="truncate text-muted-foreground">{it.stat}</span>
            <span className="font-bold text-foreground">{it.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-3 gap-2 pt-1 sm:flex sm:flex-wrap sm:items-center sm:gap-2',
        className,
      )}
    >
      {data.map((it) => (
        <div
          key={it.stat}
          className="flex items-center justify-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-medium shadow-sm sm:justify-start"
        >
          <span className="truncate text-muted-foreground">{it.stat}</span>
          <span className="font-bold text-foreground">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
