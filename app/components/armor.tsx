import type React from 'react';
import type { ItemSnapshot as ItemSnapshotType, Socket } from '~/api';
import { ArmorStats } from '~/components/armor-stats';
import { Sockets } from '~/components/sockets';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn, getItemIconUrl } from '~/lib/utils';

export interface ArmorProps extends ItemSnapshotType {
  className?: string;
  hideInlineStats?: boolean;
}

const isMod = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('mod');

export const Armor: React.FC<ArmorProps> = (props) => {
  const { details, className, hideInlineStats = true } = props;
  const { baseInfo, sockets, stats } = details;

  if (!sockets || sockets.length === 0) return null;

  const isExotic = baseInfo.tierTypeName?.toLowerCase() === 'exotic';
  const iconUrl = getItemIconUrl(details);
  const name = baseInfo.name || 'Armor Piece';
  const typeName =
    baseInfo.itemTypeDisplayName || (isExotic ? 'Exotic Armor' : 'Armor');

  const modSockets: Socket[] = sockets.filter(
    (socket) =>
      Boolean(socket.itemTypeDisplayName) &&
      Boolean(socket.isVisible) &&
      Boolean(socket.isEnabled) &&
      isMod(socket.itemTypeDisplayName!),
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'flex min-h-14 cursor-pointer touch-manipulation select-none flex-col gap-2.5 rounded-lg border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-3.5',
            isExotic
              ? 'border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15'
              : 'border-border/60 bg-muted/20 hover:bg-muted/40',
            className,
          )}
        >
          <div className="flex items-center gap-3">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={name}
                className={cn(
                  'h-10 w-10 shrink-0 rounded border object-cover',
                  isExotic ? 'border-amber-400' : 'border-border/60',
                )}
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-muted text-sm font-bold text-muted-foreground">
                {name.charAt(0)}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className={cn(
                  'truncate text-sm font-bold sm:text-base',
                  isExotic
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-foreground',
                )}
              >
                {name}
              </span>
              <span className="truncate text-xs text-muted-foreground sm:text-sm">
                {typeName}
              </span>
            </div>
          </div>

          {!hideInlineStats && stats && <ArmorStats stats={stats} />}

          {modSockets.length > 0 && (
            <Sockets
              sockets={modSockets}
              displayMode="iconOnly"
              className="flex-row flex-wrap items-center gap-2 border-t border-border/40 pt-2"
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="flex w-[calc(100vw-2rem)] flex-col gap-2 p-3 sm:w-auto sm:min-w-[230px]">
        <div className="flex flex-col gap-0.5">
          <span
            className={cn('text-sm font-bold', isExotic && 'text-amber-400')}
          >
            {name}
          </span>
          <span className="text-xs text-muted-foreground">{typeName}</span>
        </div>
        {stats && <ArmorStats stats={stats} />}
      </TooltipContent>
    </Tooltip>
  );
};
