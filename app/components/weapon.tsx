import type React from 'react';
import type { Socket, WeaponInstanceMetrics } from '~/api';
import { Sockets } from '~/components/sockets';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { WeaponKills } from '~/components/weapon-kills';
import { WeaponStats } from '~/components/weapon-stats';
import { cn, setBungieUrl } from '~/lib/utils';

interface WeaponSockets {
  intrinsic: Socket | null;
  barrel: Socket | null;
  magazine: Socket | null;
  traits: Socket[];
  shader: Socket | null;
  weaponMod: Socket | null;
  originTrait: Socket | null;
  memento: Socket | null;
}

const isIntrinsic = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('intrinsic');

const isBarrel = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('barrel');

const isMagazine = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('magazine');

const isTrait = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('trait');

const isShader = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('shader');

const isWeaponMod = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('mod');

const isOriginTrait = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('origin');

const isMemento = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('memento');

interface Props extends WeaponInstanceMetrics {
  hideStats?: boolean;
  showTitle?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export const Weapon: React.FC<Props> = ({
  properties,
  stats,
  display,
  hideStats,
  showTitle = true,
  className,
}) => {
  const weaponSockets: WeaponSockets = properties?.sockets?.reduce(
    (acc, socket) => {
      if (
        !socket.itemTypeDisplayName ||
        !socket.isVisible ||
        !socket.isEnabled
      ) {
        return acc;
      }

      const displayName = socket.itemTypeDisplayName;

      if (isIntrinsic(displayName)) {
        acc.intrinsic = socket;
      } else if (isBarrel(displayName)) {
        acc.barrel = socket;
      } else if (isMagazine(displayName)) {
        acc.magazine = socket;
      } else if (isOriginTrait(displayName)) {
        acc.originTrait = socket;
      } else if (isTrait(displayName)) {
        acc.traits.push(socket);
      } else if (isShader(displayName)) {
        acc.shader = socket;
      } else if (isWeaponMod(displayName)) {
        acc.weaponMod = socket;
      } else if (isMemento(displayName)) {
        acc.memento = socket;
      }

      return acc;
    },
    {
      intrinsic: null,
      barrel: null,
      magazine: null,
      traits: [],
      shader: null,
      weaponMod: null,
      originTrait: null,
      memento: null,
    } as WeaponSockets,
  ) ?? {
    intrinsic: null,
    barrel: null,
    magazine: null,
    traits: [],
    shader: null,
    weaponMod: null,
    originTrait: null,
    memento: null,
  };

  const row1 = [
    weaponSockets.intrinsic,
    weaponSockets.weaponMod,
    weaponSockets.shader,
    weaponSockets.memento,
  ].filter(Boolean) as Socket[];

  const row2 = [
    weaponSockets.barrel,
    weaponSockets.magazine,
    ...weaponSockets.traits,
    weaponSockets.originTrait,
  ].filter(Boolean) as Socket[];

  const icon = setBungieUrl(display?.icon ?? properties?.baseInfo?.icon);
  const name = properties?.baseInfo?.name ?? display?.name ?? 'Unknown Gun';
  const isExotic = properties?.baseInfo?.tierTypeName === 'Exotic';
  const itemType = properties?.baseInfo?.itemTypeDisplayName;

  return (
    <div
      className={cn(
        'flex w-full max-w-[360px] flex-col gap-2.5 py-1',
        className,
      )}
    >
      {/* Integrated Header Banner (Avatar Icon + Weapon Name + Type + Kills metrics) */}
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 shrink-0 rounded-md border bg-black/40 object-cover p-0.5">
          <AvatarImage src={icon} alt={`${name} image`} />
          <AvatarFallback className="rounded-md text-xs font-bold">
            {name?.charAt(0).toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          {showTitle && (
            <div className="flex items-center justify-between gap-2">
              <h5
                className={cn(
                  'truncate text-sm font-bold tracking-tight',
                  isExotic ? 'text-yellow-500' : 'text-purple-400',
                )}
              >
                {name}
              </h5>
              {itemType && (
                <span className="shrink-0 rounded bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {itemType}
                </span>
              )}
            </div>
          )}

          {stats && <WeaponKills stats={stats} />}
        </div>
      </div>

      {/* Perks / Sockets */}
      {properties?.sockets && (row1.length > 0 || row2.length > 0) && (
        <div className="flex flex-col gap-1.5 border-t pt-2">
          {row1.length > 0 && (
            <Sockets
              sockets={row1}
              displayMode="iconOnly"
              className="flex-row flex-wrap items-center gap-1"
            />
          )}
          {row2.length > 0 && (
            <Sockets
              sockets={row2}
              displayMode="iconOnly"
              className="flex-row flex-wrap items-center gap-1"
            />
          )}
        </div>
      )}

      {/* Compact Weapon Stats */}
      {!hideStats && properties?.stats && (
        <div className="border-t pt-1.5">
          <WeaponStats stats={properties.stats} compact={true} />
        </div>
      )}
    </div>
  );
};
