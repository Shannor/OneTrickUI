import type React from 'react';
import type { CharacterSnapshot } from '~/api';
import { Armor } from '~/components/armor';
import { TooltipProvider } from '~/components/ui/tooltip';
import { ArmorBuckets } from '~/constants/hashes';
import { cn } from '~/lib/utils';

interface Props {
  snapshot?: CharacterSnapshot;
  className?: string;
  hideInlineStats?: boolean;
  showHint?: boolean;
}

/**
 * ArmorSet: Renders the character's armor pieces in ArmorBuckets order together.
 * - Helmet, Gauntlets, Chest, Legs, ClassItem
 * - Hover / tap shows armor bar stats
 */
export const ArmorSet: React.FC<Props> = ({
  snapshot,
  className,
  hideInlineStats = true,
  showHint = true,
}) => {
  if (!snapshot) return null;

  const items = [
    ArmorBuckets.Helmet,
    ArmorBuckets.Gauntlets,
    ArmorBuckets.Chest,
    ArmorBuckets.Legs,
    ArmorBuckets.ClassItem,
  ]
    .map((bucket) => snapshot.loadout[bucket])
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <TooltipProvider font-sans>
      <div className="flex w-full flex-col gap-2">
        {showHint && (
          <p className="text-xs font-medium text-muted-foreground">
            💡 Hover or tap any armor piece to view exact stats
          </p>
        )}
        <div
          className={cn(
            'grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5',
            className,
          )}
        >
          {items.map((item) => (
            <Armor
              key={item.instanceId || item.itemHash}
              hideInlineStats={hideInlineStats}
              {...item}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};
