import React from 'react';
import type { Perk } from '~/api';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';

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
          const url = it.iconPath?.includes(DestinyURL)
            ? it.iconPath
            : `${DestinyURL}${it.iconPath}`;
          return (
            <div key={it.hash} className="flex flex-row gap-4">
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
