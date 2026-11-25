import { ChevronDown } from 'lucide-react';
import { Sockets } from '~/components/sockets';
import { Button } from '~/components/ui/button';
import { useSubClass } from '~/providers/sub-class-provider';

export interface SubClassHeaderProps {
  showMore?: boolean;
  onToggleShowMore?: () => void;
}

export function SubClassHeader({
  showMore,
  onToggleShowMore,
}: SubClassHeaderProps) {
  const { name, abilities } = useSubClass();
  const superSocket = abilities.super;

  return (
    <div className="flex items-center justify-between gap-2.5 rounded-lg border bg-muted/30 px-3.5 py-2.5 text-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {superSocket && (
          <Sockets
            sockets={[superSocket]}
            displayMode="iconOnly"
            className="shrink-0 flex-row items-center"
          />
        )}
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="truncate text-sm font-bold text-foreground sm:text-base">
            {name}
          </span>
          {superSocket?.name && (
            <span className="truncate text-xs text-muted-foreground sm:text-sm">
              • {superSocket.name}
            </span>
          )}
        </div>
      </div>

      {onToggleShowMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleShowMore();
          }}
          className="min-h-10 shrink-0 touch-manipulation gap-1.5 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground sm:min-h-9 sm:text-sm"
        >
          <span>{showMore ? 'Show Less' : 'Show Details'}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              showMore ? 'rotate-180' : ''
            }`}
          />
        </Button>
      )}
    </div>
  );
}
