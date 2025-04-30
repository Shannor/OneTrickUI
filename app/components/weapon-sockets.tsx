import { TooltipArrow } from '@radix-ui/react-tooltip';
import React from 'react';
import type { Socket } from '~/api';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';

interface Props {
  sockets: Socket[];
}

const DestinyURL = 'https://www.bungie.net';
export const WeaponSockets: React.FC<Props> = ({ sockets }) => {
  return (
    <div className="flex flex-col gap-2">
      {sockets
        .filter((it) => it.name !== '')
        .map((it) => {
          const url = it.icon?.includes(DestinyURL)
            ? it.icon
            : `${DestinyURL}${it.icon}`;
          return (
            <div key={it.plugHash} className="flex flex-row gap-4">
              <Tooltip>
                <TooltipContent>{it.description}</TooltipContent>
                <TooltipTrigger>
                  <Avatar>
                    <AvatarImage
                      src={url}
                      alt={`Icon for ${it.name}`}
                    ></AvatarImage>
                    <AvatarFallback>
                      {it.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
              </Tooltip>
              <div>{it.name}</div>
            </div>
          );
        })}
    </div>
  );
};
