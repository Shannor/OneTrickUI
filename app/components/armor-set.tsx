import React from 'react';
import type { CharacterSnapshot } from '~/api';
import { Armor } from '~/components/armor';
import { ArmorBuckets } from '~/constants/hashes';
import { cn } from '~/lib/utils';

interface Props {
  snapshot?: CharacterSnapshot;
  className?: string;
}

/**
 * ArmorSet: Renders the character's armor pieces in ArmorBuckets order.
 * - Helmet, Gauntlets, Chest, Legs, ClassItem
 * - Shows item name and its sockets via <Armor />
 */
export const ArmorSet: React.FC<Props> = ({ snapshot, className }) => {
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

  console.log(items);
  return (
    <div className={cn('grid grid-cols-1 gap-3', className)}>
      {items.map((item) => (
        <Armor key={item.instanceId} {...item} />
      ))}
    </div>
  );
};
