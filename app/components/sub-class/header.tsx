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
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {superSocket && (
          <Sockets
            sockets={[superSocket]}
            displayMode="iconOnly"
            className="shrink-0 flex-row items-center"
          />
        )}
        <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="truncate font-bold text-foreground sm:text-sm">
            {name}
          </span>
          {superSocket?.name && (
            <span className="truncate text-muted-foreground">
              • {superSocket.name}
            </span>
          )}
        </div>
      </div>

      {onToggleShowMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleShowMore}
          className="h-7 shrink-0 gap-1 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <span>{showMore ? 'Show Less' : 'Show Details'}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              showMore ? 'rotate-180' : ''
            }`}
          />
        </Button>
      )}
    </div>
  );
}
