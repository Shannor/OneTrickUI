import React from 'react';
import type { ItemSnapshot as ItemSnapshotType } from '~/api';
import { Label } from '~/components/label';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { getItemIconUrl } from '~/lib/utils';

interface Props {
  item: ItemSnapshotType;
  children?: React.ReactNode;
}

export const ItemSnapshot: React.FC<Props> = ({ item, children }) => {
  const { baseInfo } = item.details;
  const iconUrl = getItemIconUrl(item.details);

  return (
    <div className="flex flex-row items-center gap-2">
      <Tooltip>
        <TooltipTrigger className="inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Avatar className="h-10 w-10 rounded-sm">
            <AvatarFallback className="rounded-sm">
              {baseInfo.name.charAt(0).toUpperCase()}
            </AvatarFallback>
            <AvatarImage src={iconUrl} alt={baseInfo.name} />
          </Avatar>
        </TooltipTrigger>
        <TooltipContent className="flex flex-col gap-4">
          {children ?? <Label>{baseInfo.name}</Label>}
        </TooltipContent>
      </Tooltip>
      {!iconUrl && <Label className="truncate">{baseInfo.name}</Label>}
    </div>
  );
};
