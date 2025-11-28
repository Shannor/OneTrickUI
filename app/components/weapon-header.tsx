import { TooltipArrow } from '@radix-ui/react-tooltip';
import React from 'react';
import type { WeaponInstanceMetrics } from '~/api';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn, setBungieUrl } from '~/lib/utils';

interface Props extends WeaponInstanceMetrics {
  className?: string;
  onlyIcon?: boolean;
}
export const WeaponHeader: React.FC<Props> = ({
  properties,
  display,
  className,
  onlyIcon,
}) => {
  const icon = setBungieUrl(properties?.baseInfo?.icon ?? display?.icon);
  const name = properties?.baseInfo?.name ?? display?.name;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {icon && name && (
        <Tooltip>
          <TooltipContent>
            <TooltipArrow />
            {name}
          </TooltipContent>
          <TooltipTrigger className="cursor-default">
            <img
              alt={`${name} image`}
              src={icon}
              className="h-auto w-12 rounded-lg object-cover"
            />
          </TooltipTrigger>
        </Tooltip>
      )}
      {onlyIcon && icon ? null : (
        <h3 className="font-semibold tracking-tight">
          {properties?.baseInfo?.name ?? display?.name ?? 'Unknown Gun'}
        </h3>
      )}
    </div>
  );
};
