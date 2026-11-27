import React from 'react';
import type { WeaponInstanceMetrics } from '~/api';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn, getItemIconUrl } from '~/lib/utils';
import {
  getExoticCatalystState,
  isEnhancedWeapon,
} from '~/lib/weapon-enhancement';

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
  const icon = getItemIconUrl(properties, display?.icon);
  const name = properties?.baseInfo?.name ?? display?.name;
  const enhanced = isEnhancedWeapon(properties);
  const catalystState = getExoticCatalystState(properties);
  const hasYellowBorder = enhanced || catalystState === 'active';

  return (
    <div
      data-enhanced={enhanced ? 'true' : undefined}
      data-catalyst={catalystState !== 'none' ? catalystState : undefined}
      className={cn('flex flex-col gap-3', className)}
    >
      {icon && name && (
        <Tooltip>
          <TooltipContent>
            <TooltipArrow />
            {name}
          </TooltipContent>
          <TooltipTrigger className="inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <img
              alt={`${name} image`}
              src={icon}
              className={cn(
                'h-auto w-12 rounded-lg object-cover',
                hasYellowBorder &&
                  'border-2 border-yellow-500 dark:border-yellow-400',
              )}
            />
          </TooltipTrigger>
        </Tooltip>
      )}
      {onlyIcon && icon ? null : (
        <h3 className="text-xl font-semibold tracking-wide sm:text-2xl">
          {properties?.baseInfo?.name ?? display?.name ?? 'Unknown Gun'}
        </h3>
      )}
    </div>
  );
};
