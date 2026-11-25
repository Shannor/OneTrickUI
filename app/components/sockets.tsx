import React from 'react';
import type { Socket } from '~/api';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

export interface Props {
  sockets: Socket[];
  className?: string;
  /**
   * Controls how sockets are displayed:
   * - 'label' (default): show icon with name text next to it; tooltip shows description only
   * - 'iconOnly': show a larger icon only; tooltip shows name and description
   */
  displayMode?: 'label' | 'iconOnly';
  tooltipContent?: React.ReactNode;
}

const DestinyURL = 'https://www.bungie.net';
export const Sockets: React.FC<Props> = ({
  sockets,
  className,
  displayMode = 'label',
  tooltipContent,
}) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {sockets
        .filter((it) => it.isEnabled && it.isVisible)
        .map((it) => {
          const url = it.icon?.includes(DestinyURL)
            ? it.icon
            : `${DestinyURL}${it.icon}`;

          const isIconOnly = displayMode === 'iconOnly';
          return (
            <div
              key={it.plugHash}
              className={cn('flex flex-row items-center gap-3')}
            >
              <Tooltip>
                <TooltipTrigger className="inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <Avatar
                    className={cn(
                      'bg-gray-800 dark:bg-transparent',
                      isIconOnly ? 'h-12 w-12 p-1.5' : 'h-9 w-9 p-1',
                    )}
                  >
                    <AvatarImage
                      src={url}
                      alt={`Icon for ${it.name}`}
                    ></AvatarImage>
                    <AvatarFallback>
                      {it.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  {tooltipContent ? (
                    tooltipContent
                  ) : (
                    <div className="max-w-xs text-sm">
                      {isIconOnly ? (
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold">{it.name}</div>
                          <div className="text-muted-foreground">
                            {it.description}
                          </div>
                        </div>
                      ) : (
                        it.description
                      )}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
              {isIconOnly ? null : (
                <div className="text-sm font-medium sm:text-base">
                  {it.name}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};
