import { ChevronDown } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { Socket, WeaponInstanceMetrics } from '~/api';
import { Sockets } from '~/components/sockets';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { WeaponKills } from '~/components/weapon-kills';
import { WeaponStats } from '~/components/weapon-stats';
import { cn, getItemIconUrl } from '~/lib/utils';
import {
  getExoticCatalystState,
  isEnhancedWeapon,
  isExoticCatalystSocket,
} from '~/lib/weapon-enhancement';

interface WeaponSockets {
  intrinsic: Socket | null;
  catalyst: Socket | null;
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

interface WeaponAvatarProps {
  icon?: string;
  name: string;
  hasYellowBorder: boolean;
  size: 'compact' | 'full';
}

function WeaponAvatar({
  icon,
  name,
  hasYellowBorder,
  size,
}: WeaponAvatarProps) {
  const isCompact = size === 'compact';

  return (
    <Avatar
      data-testid="weapon-avatar"
      className={cn(
        'shrink-0 border bg-black/40 p-0.5',
        isCompact ? 'h-10 w-10 rounded' : 'h-12 w-12 rounded-md object-cover',
        hasYellowBorder && 'border-2 border-yellow-500 dark:border-yellow-400',
      )}
    >
      <AvatarImage src={icon} alt={`${name} image`} />
      <AvatarFallback
        className={cn(
          'text-xs font-bold',
          isCompact ? 'rounded' : 'rounded-md',
        )}
      >
        {name?.charAt(0).toUpperCase() ?? '?'}
      </AvatarFallback>
    </Avatar>
  );
}

interface CompactWeaponHeaderProps {
  icon?: string;
  name: string;
  isExotic: boolean;
  hasYellowBorder: boolean;
  itemType?: string;
  canToggleSockets: boolean;
  socketsOpen: boolean;
}

function CompactWeaponHeader({
  icon,
  name,
  isExotic,
  hasYellowBorder,
  itemType,
  canToggleSockets,
  socketsOpen,
}: CompactWeaponHeaderProps) {
  return (
    <>
      <WeaponAvatar
        icon={icon}
        name={name}
        hasYellowBorder={hasYellowBorder}
        size="compact"
      />

      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span
          className={cn(
            'truncate font-heading text-lg font-bold tracking-wide sm:text-xl',
            isExotic ? 'text-yellow-500' : 'text-purple-400',
          )}
        >
          {name}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {itemType && (
            <span className="rounded bg-muted/80 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {itemType}
            </span>
          )}
          {canToggleSockets && (
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                socketsOpen && 'rotate-180',
              )}
            />
          )}
        </div>
      </div>
    </>
  );
}

interface Props extends WeaponInstanceMetrics {
  hideStats?: boolean;
  showTitle?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
  compact?: boolean;
  expandableSockets?: boolean;
  defaultSocketsOpen?: boolean;
}

export const Weapon: React.FC<Props> = ({
  properties,
  stats,
  display,
  hideStats,
  showTitle = true,
  className,
  compact = false,
  expandableSockets = true,
  defaultSocketsOpen = false,
}) => {
  const [socketsOpen, setSocketsOpen] = useState(defaultSocketsOpen);
  const isExotic =
    properties?.baseInfo?.tierType === 6 ||
    properties?.baseInfo?.tierTypeName?.toLowerCase() === 'exotic';

  const weaponSockets: WeaponSockets = properties?.sockets?.reduce(
    (acc, socket) => {
      if (!socket.isVisible || !socket.isEnabled) {
        return acc;
      }

      if (isExotic && isExoticCatalystSocket(socket, { isExotic: true })) {
        acc.catalyst = socket;
        return acc;
      }

      if (!socket.itemTypeDisplayName) {
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
      catalyst: null,
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
    catalyst: null,
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
    weaponSockets.catalyst,
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

  const icon = getItemIconUrl(properties, display?.icon);
  const name = properties?.baseInfo?.name ?? display?.name ?? 'Unknown Gun';
  const itemType = properties?.baseInfo?.itemTypeDisplayName;
  const enhanced = isEnhancedWeapon(properties);
  const catalystState = getExoticCatalystState(properties);
  const hasYellowBorder = enhanced || catalystState === 'active';

  if (compact) {
    const allSockets = [...row1, ...row2];
    const hasSockets = Boolean(properties?.sockets && allSockets.length > 0);
    const canToggleSockets = hasSockets && expandableSockets;

    return (
      <div
        data-enhanced={enhanced ? 'true' : undefined}
        data-catalyst={catalystState !== 'none' ? catalystState : undefined}
        className={cn('flex flex-col gap-1.5 py-1', className)}
      >
        {canToggleSockets ? (
          <button
            type="button"
            aria-expanded={socketsOpen}
            onClick={(e) => {
              e.stopPropagation();
              setSocketsOpen((prev) => !prev);
            }}
            className="flex min-h-11 w-full cursor-pointer touch-manipulation items-center gap-2.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <CompactWeaponHeader
              icon={icon}
              name={name}
              isExotic={isExotic}
              hasYellowBorder={hasYellowBorder}
              itemType={itemType}
              canToggleSockets={canToggleSockets}
              socketsOpen={socketsOpen}
            />
          </button>
        ) : (
          <div className="flex min-h-11 items-center gap-2.5 rounded-md">
            <CompactWeaponHeader
              icon={icon}
              name={name}
              isExotic={isExotic}
              hasYellowBorder={hasYellowBorder}
              itemType={itemType}
              canToggleSockets={canToggleSockets}
              socketsOpen={socketsOpen}
            />
          </div>
        )}

        {hasSockets && socketsOpen && (
          <Sockets
            sockets={allSockets}
            displayMode="iconOnly"
            isExotic={isExotic}
            className="flex-row flex-wrap items-center gap-2 pt-1.5 sm:pl-12"
          />
        )}
      </div>
    );
  }

  return (
    <div
      data-enhanced={enhanced ? 'true' : undefined}
      data-catalyst={catalystState !== 'none' ? catalystState : undefined}
      className={cn('flex w-full flex-col gap-3 py-1.5', className)}
    >
      <div className="flex items-center gap-3">
        <WeaponAvatar
          icon={icon}
          name={name}
          hasYellowBorder={hasYellowBorder}
          size="full"
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          {showTitle && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5
                className={cn(
                  'truncate text-xl font-bold tracking-wide sm:text-2xl',
                  isExotic ? 'text-yellow-500' : 'text-purple-400',
                )}
              >
                {name}
              </h5>
              {itemType && (
                <span className="shrink-0 rounded bg-muted/80 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {itemType}
                </span>
              )}
            </div>
          )}

          {stats && <WeaponKills stats={stats} />}
        </div>
      </div>

      {properties?.sockets && (row1.length > 0 || row2.length > 0) && (
        <div className="flex flex-col gap-2 border-t pt-2.5">
          {row1.length > 0 && (
            <Sockets
              sockets={row1}
              displayMode="iconOnly"
              isExotic={isExotic}
              className="flex-row flex-wrap items-center gap-2"
            />
          )}
          {row2.length > 0 && (
            <Sockets
              sockets={row2}
              displayMode="iconOnly"
              isExotic={isExotic}
              className="flex-row flex-wrap items-center gap-2"
            />
          )}
        </div>
      )}

      {!hideStats && properties?.stats && (
        <div className="border-t pt-2">
          <WeaponStats stats={properties.stats} compact={true} />
        </div>
      )}
    </div>
  );
};
