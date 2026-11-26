import type React from 'react';
import type { CharacterSnapshot } from '~/api';
import { Armor } from '~/components/armor';
import { ArmorSetBonusesPanel } from '~/components/armor-set-bonuses';
import { TooltipProvider } from '~/components/ui/tooltip';
import { ArmorBuckets } from '~/constants/hashes';
import { cn } from '~/lib/utils';

interface Props {
  snapshot?: CharacterSnapshot;
  className?: string;
  hideInlineStats?: boolean;
  showHint?: boolean;
}

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

  const armorSetBonuses = snapshot.armorSetBonuses ?? [];

  if (items.length === 0 && armorSetBonuses.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex w-full flex-col gap-4">
        {items.length > 0 && (
          <div className="flex w-full flex-col gap-2.5">
            {showHint && (
              <p className="text-sm font-medium text-muted-foreground">
                Hover or tap any armor piece to view exact stats
              </p>
            )}
            <div
              className={cn(
                'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5',
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
        )}
        <ArmorSetBonusesPanel bonuses={armorSetBonuses} />
      </div>
    </TooltipProvider>
  );
};
