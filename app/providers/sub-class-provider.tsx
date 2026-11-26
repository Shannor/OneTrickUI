import React, { createContext, useContext } from 'react';
import type { CharacterSnapshot, Socket } from '~/api';
import { Empty } from '~/components/empty';

const SUB_CLASS_HASH = 3284755031;

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

function processSockets(sockets: Socket[]): ClassAbilities {
  return sockets.reduce<ClassAbilities>(
    (acc, socket) => {
      if (
        !socket.itemTypeDisplayName ||
        !socket.isVisible ||
        !socket.isEnabled
      ) {
        return acc;
      }

      const displayName = socket.itemTypeDisplayName;

      if (isClassAbility(displayName)) acc.classAbility = socket;
      else if (isMovement(displayName)) acc.movementAbility = socket;
      else if (isSuper(displayName)) acc.super = socket;
      else if (isMelee(displayName)) acc.melee = socket;
      else if (isGrenade(displayName)) acc.grenade = socket;
      else if (isAspect(displayName)) acc.aspects.push(socket);
      else if (isFragment(displayName)) acc.fragments.push(socket);

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
    },
  );
}

function hasResolvedAbilities(abilities: ClassAbilities): boolean {
  return Boolean(
    abilities.super ||
      abilities.classAbility ||
      abilities.movementAbility ||
      abilities.melee ||
      abilities.grenade ||
      abilities.aspects.length > 0 ||
      abilities.fragments.length > 0,
  );
}

interface SubClassContextType {
  abilities: ClassAbilities;
  name: string;
  icon?: string;
  hasSockets: boolean;
}

const SubClassContext = createContext<SubClassContextType | null>(null);

export function useSubClass() {
  const context = useContext(SubClassContext);
  if (!context) {
    throw new Error('useSubClass must be used within a SubClassProvider');
  }
  return context;
}

interface Props {
  snapshot?: CharacterSnapshot;
  children: React.ReactNode;
}

export const SubClassProvider: React.FC<Props> = ({ snapshot, children }) => {
  if (!snapshot) return null;

  const itemSnapshot = snapshot.loadout?.[SUB_CLASS_HASH];
  if (!itemSnapshot) return <Empty title="Unknown Subclass" />;

  const name =
    itemSnapshot.details?.baseInfo?.name || itemSnapshot.name || 'Subclass';
  const icon = itemSnapshot.details?.baseInfo?.icon;
  const sockets = itemSnapshot.details?.sockets ?? [];
  const abilities = processSockets(sockets);
  const hasSockets = hasResolvedAbilities(abilities);

  return (
    <SubClassContext.Provider value={{ abilities, name, icon, hasSockets }}>
      {children}
    </SubClassContext.Provider>
  );
};
