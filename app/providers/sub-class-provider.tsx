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

interface SubClassContextType {
  abilities: ClassAbilities;
  name: string;
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

  const itemSnapshot = snapshot.loadout[SUB_CLASS_HASH];
  if (!itemSnapshot) return <Empty title="Unknown Subclass" />;

  const {
    name,
    details: { sockets },
  } = itemSnapshot;
  if (!sockets) return <Empty title="No Sockets Found" />;

  const abilities = processSockets(sockets);

  return (
    <SubClassContext.Provider value={{ abilities, name }}>
      {children}
    </SubClassContext.Provider>
  );
};
