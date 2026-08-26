import { ChevronDown } from 'lucide-react';
import type { Socket } from '~/api';
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

  const mainSockets = [
    abilities.super,
    abilities.grenade,
    abilities.melee,
    abilities.classAbility,
    abilities.movementAbility,
  ].filter(Boolean) as Socket[];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex items-center gap-3">
        {/* Subclass name & Super name */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground sm:text-sm">{name}</span>
          {superSocket?.name && (
            <span className="text-muted-foreground">• {superSocket.name}</span>
          )}
        </div>

        {/* Main ability icons */}
        {mainSockets.length > 0 && (
          <Sockets
            sockets={mainSockets}
            displayMode="iconOnly"
            className="flex-row items-center gap-1.5 border-l pl-3"
          />
        )}
      </div>

      {onToggleShowMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleShowMore}
          className="h-7 gap-1 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
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
