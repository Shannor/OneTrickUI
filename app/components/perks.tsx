import React from 'react';
import type { Perk } from '~/api';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { setBungieUrl } from '~/lib/utils';

interface Props {
  perks: Perk[];
}

const DestinyURL = 'https://www.bungie.net';
export const Perks: React.FC<Props> = ({ perks }) => {
  return (
    <div className="flex flex-col gap-2">
      {perks
        .filter((it) => it.name !== '')
        .map((it) => {
          const url = setBungieUrl(it.iconPath);
          return (
            <div key={it.hash} className="flex flex-row items-center gap-3">
              <Tooltip>
                <TooltipContent className="text-sm sm:max-w-xs">
                  {it.description}
                </TooltipContent>
                <TooltipTrigger className="inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <Avatar className="h-9 w-9">
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
              <div className="text-sm font-medium sm:text-base">{it.name}</div>
            </div>
          );
        })}
    </div>
  );
};
