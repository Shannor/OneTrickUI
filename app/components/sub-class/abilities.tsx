import React from 'react';
import type { Socket } from '~/api';
import { Label } from '~/components/label';
import { type Props as SocketProps, Sockets } from '~/components/sockets';
import { cn } from '~/lib/utils';
import { useSubClass } from '~/providers/sub-class-provider';

interface Props {
  displayMode?: SocketProps['displayMode'];
  className?: string;
}
export const Abilities: React.FC<Props> = ({ displayMode, className }) => {
  const { abilities } = useSubClass();
  const row = [
    abilities.classAbility,
    abilities.movementAbility,
    abilities.melee,
    abilities.grenade,
  ].filter(Boolean) as Socket[];

  if (row.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label>Abilities</Label>
      <Sockets
        sockets={row}
        displayMode={displayMode ?? 'iconOnly'}
        className="flex-row flex-wrap items-center"
      />
    </div>
  );
};
