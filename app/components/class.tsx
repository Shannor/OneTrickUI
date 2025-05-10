import React from 'react';
import type { CharacterSnapshot, ItemSnapshot } from '~/api';
import { Perks } from '~/components/perks';
import { Sockets } from '~/components/sockets';

interface Props {
  snapshot?: CharacterSnapshot;
}

const SubClass = 3284755031;
export const Class: React.FC<Props> = ({ snapshot }) => {
  if (!snapshot) {
    return null;
  }

  const itemSnapshot = snapshot.loadout[SubClass];
  const {
    name,
    details: { sockets, perks },
  } = itemSnapshot;
  console.log(sockets, perks);
  return (
    <div>
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        {name ?? 'Class Unknown'}
      </h4>
      {sockets && <Sockets sockets={sockets} className="flex-row flex-wrap" />}
    </div>
  );
};
