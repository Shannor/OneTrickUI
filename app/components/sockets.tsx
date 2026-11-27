import React from 'react';
import type { Socket } from '~/api';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import {
  isEnhancedSocket,
  isExoticCatalystSocket,
} from '~/lib/weapon-enhancement';

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
  isExotic?: boolean;
}

const DESTINY_URL = 'https://www.bungie.net';

interface SocketTooltipDetailsProps {
  socket: Socket;
  isIconOnly: boolean;
}

function SocketTooltipDetails({
  socket,
  isIconOnly,
}: SocketTooltipDetailsProps) {
  if (isIconOnly) {
    return (
      <div className="flex min-w-0 flex-col gap-1 break-words text-sm sm:max-w-xs">
        <span className="font-semibold">{socket.name}</span>
        <div className="text-muted-foreground">{socket.description}</div>
      </div>
    );
  }

  return (
    <div className="min-w-0 break-words text-sm sm:max-w-xs">
      {socket.description}
    </div>
  );
}

export const Sockets: React.FC<Props> = ({
  sockets,
  className,
  displayMode = 'label',
  tooltipContent,
  isExotic = false,
}) => {
  const isIconOnly = displayMode === 'iconOnly';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {sockets
        .filter((it) => it.isEnabled && it.isVisible)
        .map((it) => {
          const url = it.icon?.includes(DESTINY_URL)
            ? it.icon
            : `${DESTINY_URL}${it.icon}`;
          const enhanced = isEnhancedSocket(it);
          const catalyst =
            !enhanced && isExoticCatalystSocket(it, { isExotic });
          const hasYellowBorder = enhanced || catalyst;

          return (
            <div
              key={it.plugHash}
              className={cn('flex flex-row items-center gap-3')}
            >
              <Tooltip>
                <TooltipTrigger
                  data-enhanced={enhanced ? 'true' : undefined}
                  data-catalyst={catalyst ? 'true' : undefined}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Avatar
                    className={cn(
                      'bg-gray-800 dark:bg-transparent',
                      isIconOnly ? 'h-12 w-12 p-1.5' : 'h-9 w-9 p-1',
                      hasYellowBorder &&
                        'border-2 border-yellow-500 dark:border-yellow-400',
                    )}
                  >
                    <AvatarImage src={url} alt={`Icon for ${it.name}`} />
                    <AvatarFallback>
                      {it.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  {tooltipContent ?? (
                    <SocketTooltipDetails socket={it} isIconOnly={isIconOnly} />
                  )}
                </TooltipContent>
              </Tooltip>
              {!isIconOnly && (
                <span className="text-sm font-medium sm:text-base">
                  {it.name}
                </span>
              )}
            </div>
          );
        })}
    </div>
  );
};
