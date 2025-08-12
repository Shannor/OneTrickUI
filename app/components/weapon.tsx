import React from 'react';
import type { Socket, WeaponInstanceMetrics } from '~/api';
import { Sockets } from '~/components/sockets';
import { WeaponKills } from '~/components/weapon-kills';
import { WeaponStats } from '~/components/weapon-stats';

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

// Functions to check weapon socket types by itemTypeDisplayName using substring matching
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

type Props = WeaponInstanceMetrics;
export const Weapon: React.FC<Props> = ({ properties, stats, display }) => {
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
        // This order matter since we're doing string comps
        // Origin Trait has "trait" in it so it could include other stuff
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

  return (
    <div className="flex max-w-[350px] flex-col gap-4">
      {display?.icon && (
        <img
          alt={`${display.name} image`}
          width="75"
          height="75"
          src={display?.icon}
        />
      )}
      <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
        {properties?.baseInfo?.name ?? display?.name ?? 'Unknown Gun'}
      </h3>

      <div className="flex w-full flex-col gap-8">
        {stats && (
          <div className="flex flex-col self-center">
            <WeaponKills stats={stats} />
          </div>
        )}
        <div className="flex w-full flex-grow flex-col gap-4">
          {properties?.stats && <WeaponStats stats={properties.stats} />}
          {properties?.sockets && (
            <div className="flex flex-col gap-2">
              {/* Row 1: Intrinsic, Mod, Shader */}
              <Sockets
                sockets={row1}
                displayMode="iconOnly"
                className="flex-row flex-wrap items-center"
              />

              {/* Row 2: Barrel, Magazine, Traits..., Origin Trait */}
              <Sockets
                sockets={row2}
                displayMode="iconOnly"
                className="flex-row flex-wrap items-center"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
