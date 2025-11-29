import React from 'react';
import { Label } from '~/components/label';
import { Sockets } from '~/components/sockets';
import { useSubClass } from '~/providers/sub-class-provider';

export const Aspects: React.FC = () => {
  const { abilities } = useSubClass();
  const sockets = abilities.aspects;

  if (sockets.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <Label>Aspects</Label>
      <Sockets
        sockets={sockets}
        displayMode="iconOnly"
        className="flex-row flex-wrap items-center"
      />
    </div>
  );
};
