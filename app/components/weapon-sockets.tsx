import React from 'react';
import type { Socket } from '~/api';

interface Props {
  sockets: Socket[];
}

export const WeaponSockets: React.FC<Props> = ({ sockets }) => {
  return (
    <div>
      {sockets.map((it) => (
        <div key={it.plugHash}>
          <div>{it.name}</div>
        </div>
      ))}
    </div>
  );
};
