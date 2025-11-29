import React from 'react';
import type { ItemSnapshot as ItemSnapshotType } from '~/api';
import { Label } from '~/components/label';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { setBungieUrl } from '~/lib/utils';

interface Props {
  item: ItemSnapshotType;
  children?: React.ReactNode;
}

export const ItemSnapshot: React.FC<Props> = ({ item, children }) => {
  const { baseInfo } = item.details;

  return (
    <div className="flex flex-row items-center gap-2">
      <Tooltip>
        <TooltipTrigger>
          <Avatar className="h-10 w-10 rounded-sm">
            <AvatarFallback className="rounded-sm">
              {baseInfo.name.charAt(0).toUpperCase()}
            </AvatarFallback>
            <AvatarImage
              src={setBungieUrl(baseInfo.icon)}
              alt={baseInfo.name}
            />
          </Avatar>
        </TooltipTrigger>
        <TooltipContent className="flex flex-col gap-4">
          {children ?? <Label>{baseInfo.name}</Label>}
        </TooltipContent>
      </Tooltip>
      {!baseInfo.icon && <Label className="truncate">{baseInfo.name}</Label>}
    </div>
  );
};
