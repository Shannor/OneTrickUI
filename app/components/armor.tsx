import React from 'react';
import type { ItemSnapshot as ItemSnapshotType, Socket } from '~/api';
import { ArmorStats } from '~/components/armor-stats';
import { ItemSnapshot } from '~/components/item-snapshot';
import { Sockets } from '~/components/sockets';
import { cn } from '~/lib/utils';

interface Props extends ItemSnapshotType {
  className?: string;
}
interface ArmorSockets {
  mod: Socket[];
  shader: Socket | null;
  ornament: Socket | null;
}
// Functions to check item types by itemTypeDisplayName using substring matching
const isMod = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('mod');

const isOrnament = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('ornament');
/**
 * Armor: reusable renderer for an armor item's sockets.
 * - Accepts the sockets array like Weapon does, and renders them in a compact row using icon-only mode.
 */
export const Armor: React.FC<Props> = (props) => {
  const { details, className } = props;
  const { baseInfo, sockets, perks, stats } = details;
  if (!sockets || sockets.length === 0) return null;
  const weaponSockets: ArmorSockets =
    sockets?.reduce(
      (acc, socket) => {
        if (
          !socket.itemTypeDisplayName ||
          !socket.isVisible ||
          !socket.isEnabled
        ) {
          return acc;
        }

        const displayName = socket.itemTypeDisplayName;

        if (isMod(displayName)) {
          acc.mod.push(socket);
        } else if (isOrnament(displayName)) {
          acc.ornament = socket;
        }
        return acc;
      },
      {
        mod: [],
        shader: null,
        ornament: null,
      } as ArmorSockets,
    ) ?? {};
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <ItemSnapshot item={props} />
      <ArmorStats stats={stats} />
      <Sockets
        sockets={weaponSockets.mod}
        displayMode="iconOnly"
        className="flex-row flex-wrap items-center"
      />
    </div>
  );
};
