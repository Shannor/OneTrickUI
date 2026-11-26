import { Crosshair, Target, Zap } from 'lucide-react';
import type { UniqueStatValue } from '~/api';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';

interface WeaponKillsProps {
  stats: Record<string, UniqueStatValue>;
}

type StatKeys =
  | 'uniqueWeaponKills'
  | 'uniqueWeaponKillsPrecisionKills'
  | 'uniqueWeaponPrecisionKills';

function getStatMeta(key: StatKeys) {
  switch (key) {
    case 'uniqueWeaponKills':
      return {
        label: 'Kills',
        icon: <Crosshair className="h-3.5 w-3.5 shrink-0 text-primary" />,
      };
    case 'uniqueWeaponKillsPrecisionKills':
      return {
        label: 'Accuracy',
        icon: <Target className="h-3.5 w-3.5 shrink-0 text-blue-400" />,
      };
    case 'uniqueWeaponPrecisionKills':
      return {
        label: 'Headshots / Precision',
        icon: <Zap className="h-3.5 w-3.5 shrink-0 text-yellow-400" />,
      };
    default:
      return {
        label: key,
        icon: (
          <Crosshair className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ),
      };
  }
}

export function WeaponKills({ stats }: WeaponKillsProps) {
  const entries = Object.entries(stats);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
      {entries.map(([key, value]) => {
        const meta = getStatMeta(key as StatKeys);
        const displayValue = value.basic?.displayValue ?? '0';

        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex min-h-9 cursor-pointer touch-manipulation items-center gap-1.5 rounded-md bg-muted/40 px-2.5 py-1 font-semibold text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {meta.icon}
                <span>{displayValue}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="text-xs font-medium sm:text-sm"
            >
              {meta.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
