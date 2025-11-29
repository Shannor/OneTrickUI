import React from 'react';
import { Sockets } from '~/components/sockets';
import { useSubClass } from '~/providers/sub-class-provider';

interface Props {
  hideName?: boolean;
  tooltipContent?: React.ReactNode;
}
export const Super: React.FC<Props> = ({ hideName, tooltipContent }) => {
  const { name, abilities } = useSubClass();
  const socket = abilities.super;

  if (!socket) return null;

  return (
    <div className="flex flex-row items-center gap-4">
      <Sockets
        sockets={[socket]}
        displayMode="iconOnly"
        className="flex-row flex-wrap items-center"
        tooltipContent={tooltipContent}
      />
      {hideName ? null : (
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          {name}
        </h4>
      )}
    </div>
  );
};
