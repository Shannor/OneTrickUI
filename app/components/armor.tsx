import type React from 'react';
import { useState } from 'react';
import type { ItemSnapshot as ItemSnapshotType, Socket } from '~/api';
import { ArmorStats } from '~/components/armor-stats';
import { Sockets } from '~/components/sockets';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn, setBungieUrl } from '~/lib/utils';

export interface ArmorProps extends ItemSnapshotType {
  className?: string;
  hideInlineStats?: boolean;
}

interface ArmorSockets {
  mod: Socket[];
  shader: Socket | null;
  ornament: Socket | null;
}

const isMod = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('mod');

const isOrnament = (itemTypeDisplayName: string): boolean =>
  itemTypeDisplayName.toLowerCase().includes('ornament');

export const Armor: React.FC<ArmorProps> = (props) => {
  const { details, className, hideInlineStats = true } = props;
  const { baseInfo, sockets, stats } = details;
  const [open, setOpen] = useState(false);

  if (!sockets || sockets.length === 0) return null;

  const isExotic = baseInfo.tierTypeName?.toLowerCase() === 'exotic';
  const iconUrl = setBungieUrl(baseInfo.icon);
  const name = baseInfo.name || 'Armor Piece';
  const typeName =
    baseInfo.itemTypeDisplayName || (isExotic ? 'Exotic Armor' : 'Armor');

  const weaponSockets: ArmorSockets =
    sockets?.reduce(
      (acc, socket) => {
        if (
          !socket.itemTypeDisplayName ||
          !socket.isVisible ||
          !socket.isEnabled
        ) {
          return acc;
        }

        const displayName = socket.itemTypeDisplayName;

        if (isMod(displayName)) {
          acc.mod.push(socket);
        } else if (isOrnament(displayName)) {
          acc.ornament = socket;
        }
        return acc;
      },
      {
        mod: [],
        shader: null,
        ornament: null,
      } as ArmorSockets,
    ) ?? {};

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex cursor-pointer select-none flex-col gap-2 rounded-lg border p-2.5 transition-colors',
            isExotic
              ? 'border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15'
              : 'border-border/60 bg-muted/20 hover:bg-muted/40',
            className,
          )}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
        >
          <div className="flex items-center gap-2.5">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={name}
                className={cn(
                  'h-8 w-8 shrink-0 rounded border object-cover',
                  isExotic ? 'border-amber-400' : 'border-border/60',
                )}
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-muted font-bold text-muted-foreground">
                {name.charAt(0)}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className={cn(
                  'truncate text-xs font-bold sm:text-sm',
                  isExotic
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-foreground',
                )}
              >
                {name}
              </span>
              <span className="truncate text-[10px] text-muted-foreground sm:text-xs">
                {typeName}
              </span>
            </div>
          </div>

          {!hideInlineStats && stats && <ArmorStats stats={stats} />}

          {weaponSockets.mod.length > 0 && (
            <Sockets
              sockets={weaponSockets.mod}
              displayMode="iconOnly"
              className="flex-row flex-wrap items-center border-t border-border/40 pt-1"
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="flex min-w-[220px] flex-col gap-2">
        <div className="flex flex-col">
          <span className={cn('font-bold', isExotic && 'text-amber-400')}>
            {name}
          </span>
          <span className="text-xs text-muted-foreground">{typeName}</span>
        </div>
        {stats && <ArmorStats stats={stats} />}
      </TooltipContent>
    </Tooltip>
  );
};
