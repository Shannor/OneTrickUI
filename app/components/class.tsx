import React from 'react';
import type { CharacterSnapshot, Socket } from '~/api';
import { Empty } from '~/components/empty';
import { Label } from '~/components/label';
import { Sockets } from '~/components/sockets';

interface Props {
  snapshot?: CharacterSnapshot;
  condensed?: boolean;
}

const SubClass = 3284755031;
// Functions to check item types by itemTypeDisplayName using substring matching
const isClassAbility = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('class');

const isMovement = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('movement');

const isSuper = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('super');

const isMelee = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('melee');

const isGrenade = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('grenade');

const isAspect = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('aspect');

const isFragment = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('fragment');

interface ClassAbilities {
  classAbility: Socket | null;
  movementAbility: Socket | null;
  super: Socket | null;
  melee: Socket | null;
  grenade: Socket | null;
  aspects: Socket[];
  fragments: Socket[];
}

export const Class: React.FC<Props> = ({ snapshot, condensed = false }) => {
  if (!snapshot) {
    return null;
  }

  const itemSnapshot = snapshot.loadout[SubClass];
  if (!itemSnapshot) {
    return <Empty title="Unknown Subclass" />;
  }

  const {
    name,
    details: { sockets },
  } = itemSnapshot;

  const abilities = sockets?.reduce(
    (acc, socket) => {
      if (
        !socket.itemTypeDisplayName ||
        !socket.isVisible ||
        !socket.isEnabled
      ) {
        return acc;
      }

      const displayName = socket.itemTypeDisplayName;

      if (isClassAbility(displayName)) {
        acc.classAbility = socket;
      } else if (isMovement(displayName)) {
        acc.movementAbility = socket;
      } else if (isSuper(displayName)) {
        acc.super = socket;
      } else if (isMelee(displayName)) {
        acc.melee = socket;
      } else if (isGrenade(displayName)) {
        acc.grenade = socket;
      } else if (isAspect(displayName)) {
        acc.aspects.push(socket);
      } else if (isFragment(displayName)) {
        acc.fragments.push(socket);
      }

      return acc;
    },
    {
      classAbility: null,
      movementAbility: null,
      super: null,
      melee: null,
      grenade: null,
      aspects: [],
      fragments: [],
    } as ClassAbilities,
  );

  // Build ordered rows for UI
  const abilitiesRow = [
    abilities?.classAbility,
    abilities?.movementAbility,
    abilities?.melee,
    abilities?.grenade,
  ].filter(Boolean) as Socket[];

  if (abilitiesRow.length === 0) {
    return (
      <Empty
        title="No Subclass Found"
        description="The class couldn't be found. Could be a legacy loadout."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {abilities?.super && (
        <div className="flex flex-row items-center gap-4">
          <Sockets
            sockets={[abilities.super]}
            displayMode="iconOnly"
            className="flex-row flex-wrap items-center"
          />
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            {name ?? 'Class Unknown'}
          </h4>
        </div>
      )}
      {!condensed && (
        <>
          <div className="flex flex-row gap-8">
            {/* Abilities row: Super, Class, Movement, Melee, Grenade */}
            {abilitiesRow.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Abilities</Label>
                <Sockets
                  sockets={abilitiesRow}
                  displayMode="iconOnly"
                  className="flex-row flex-wrap items-center"
                />
              </div>
            )}

            {/* Aspects row */}
            {abilities?.aspects?.length ? (
              <div className="flex flex-col gap-2">
                <Label>Aspects</Label>
                <Sockets
                  sockets={abilities.aspects}
                  displayMode="iconOnly"
                  className="flex-row flex-wrap items-center"
                />
              </div>
            ) : null}
          </div>
          {/* Fragments row */}
          {abilities?.fragments?.length ? (
            <div className="flex flex-col gap-2">
              <Label>Fragments</Label>
              <Sockets
                sockets={abilities.fragments}
                displayMode="iconOnly"
                className="flex-row flex-wrap items-center"
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
