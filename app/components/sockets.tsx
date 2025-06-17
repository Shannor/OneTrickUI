import { TooltipArrow } from '@radix-ui/react-tooltip';
import { clsx } from 'clsx';
import React from 'react';
import { twMerge } from 'tailwind-merge';
import type { Socket } from '~/api';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';

interface Props {
  sockets: Socket[];
  className?: string;
}

const DestinyURL = 'https://www.bungie.net';
export const Sockets: React.FC<Props> = ({ sockets, className }) => {
  return (
    <div className={twMerge(clsx('flex flex-col gap-2', className))}>
      {sockets
        .filter((it) => it.isEnabled && it.isVisible)
        .map((it) => {
          const url = it.icon?.includes(DestinyURL)
            ? it.icon
            : `${DestinyURL}${it.icon}`;
          return (
            <div key={it.plugHash} className="flex flex-row gap-4">
              <Tooltip>
                <TooltipContent>{it.description}</TooltipContent>
                <TooltipTrigger>
                  <Avatar className="bg-gray-800 p-1 dark:bg-transparent">
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
