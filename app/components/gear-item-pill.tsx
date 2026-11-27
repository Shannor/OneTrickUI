import React from 'react';
import type { ItemSnapshot } from '~/api';
import { ArmorStats } from '~/components/armor-stats';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { WeaponStats } from '~/components/weapon-stats';
import { isExoticItem } from '~/hooks/use-loadout';
import { cn, getItemIconUrl } from '~/lib/utils';
import {
  getExoticCatalystState,
  isEnhancedWeapon,
} from '~/lib/weapon-enhancement';

export function getGearItemName(item?: ItemSnapshot): string {
  return item?.details?.baseInfo?.name || item?.name || 'None';
}

export function hasArmorStats(item?: ItemSnapshot): boolean {
  if (!item?.details?.stats) return false;
  const statNames = Object.values(item.details.stats).map((s) => s.name);
  return statNames.some((n) =>
    ['Super', 'Health', 'Grenade', 'Melee', 'Class', 'Weapons'].includes(n),
  );
}

export interface GearItemDetailsSummaryProps {
  item?: ItemSnapshot;
  heading?: string;
}

export function GearItemDetailsSummary({
  item,
  heading,
}: GearItemDetailsSummaryProps) {
  if (!item) {
    return (
      <div className="flex flex-col gap-1">
        {heading && (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {heading}
          </span>
        )}
        <span className="text-sm text-muted-foreground">None equipped</span>
      </div>
    );
  }

  const name = getGearItemName(item);
  const typeName =
    item.details?.baseInfo?.itemTypeAndTierDisplayName ||
    item.details?.baseInfo?.itemTypeDisplayName ||
    '';
  const isExotic = isExoticItem(item);
  const stats = item.details?.stats;
  const isArmor = hasArmorStats(item);
  const perks = (item.details?.perks ?? []).filter((p) => p?.name);

  return (
    <div className="flex flex-col gap-2">
      {heading && (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            'text-sm font-bold',
            isExotic ? 'text-amber-500 dark:text-amber-400' : 'text-foreground',
          )}
        >
          {name}
        </span>
        {typeName && (
          <span className="text-xs text-muted-foreground">{typeName}</span>
        )}
      </div>
      {stats && Object.keys(stats).length > 0 && (
        <div className="min-w-0 pt-0.5 text-xs sm:min-w-[200px] sm:text-sm">
          {isArmor ? (
            <ArmorStats stats={stats} />
          ) : (
            <WeaponStats stats={stats} compact={true} />
          )}
        </div>
      )}
      {perks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {perks.slice(0, 4).map((perk, idx) => (
            <span
              key={`${String(perk.hash)}-${idx}`}
              className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {perk.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface GearItemPillIconProps {
  iconUrl?: string;
  name: string;
  size: 'sm' | 'md';
  isExotic: boolean;
  hasYellowBorder: boolean;
}

function GearItemPillIcon({
  iconUrl,
  name,
  size,
  isExotic,
  hasYellowBorder,
}: GearItemPillIconProps) {
  const borderClass = hasYellowBorder
    ? 'border-2 border-yellow-500 dark:border-yellow-400'
    : 'border-border/60';

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={name}
        className={cn(
          'shrink-0 rounded border object-cover',
          size === 'md' ? 'h-9 w-9 sm:h-8 sm:w-8' : 'h-8 w-8 sm:h-7 sm:w-7',
          borderClass,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded border bg-muted font-bold',
        size === 'md'
          ? 'h-9 w-9 text-sm sm:h-8 sm:w-8 sm:text-xs'
          : 'h-8 w-8 text-xs sm:h-7 sm:w-7 sm:text-[10px]',
        borderClass,
        isExotic
          ? 'text-amber-500 dark:text-amber-400'
          : 'text-muted-foreground',
      )}
    >
      {name.charAt(0)}
    </div>
  );
}

export interface GearItemPillProps {
  item?: ItemSnapshot;
  label?: string;
  subtitle?: string;
  highlight?: boolean;
  size?: 'sm' | 'md';
  tooltipHeading?: string;
  tooltipContent?: React.ReactNode;
  className?: string;
}

export function GearItemPill({
  item,
  label,
  subtitle,
  highlight,
  size = 'sm',
  tooltipHeading,
  tooltipContent,
  className,
}: GearItemPillProps) {
  const isExotic = highlight ?? isExoticItem(item);
  const enhanced = isEnhancedWeapon(item);
  const catalystState = getExoticCatalystState(item);
  const hasYellowBorder = enhanced || catalystState === 'active';
  const name = getGearItemName(item);
  const iconUrl = getItemIconUrl(item?.details);
  const resolvedSubtitle =
    subtitle ??
    item?.details?.baseInfo?.itemTypeDisplayName ??
    (isExotic ? 'Exotic' : 'Gear');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-enhanced={enhanced ? 'true' : undefined}
          data-catalyst={catalystState !== 'none' ? catalystState : undefined}
          className={cn(
            'flex w-full min-w-0 cursor-pointer touch-manipulation items-center gap-2.5 rounded-md text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:gap-2.5 sm:text-xs',
            size === 'md'
              ? 'min-h-11 gap-3 p-1.5 font-medium sm:min-h-0 sm:p-1'
              : 'min-h-11 p-1.5 sm:min-h-0 sm:p-1',
            isExotic
              ? 'text-foreground hover:bg-amber-500/10'
              : 'text-foreground hover:bg-muted/50',
            className,
          )}
        >
          <GearItemPillIcon
            iconUrl={iconUrl}
            name={name}
            size={size}
            isExotic={isExotic}
            hasYellowBorder={hasYellowBorder}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {label ? (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                  {label}
                </span>
                <span
                  className={cn(
                    'truncate text-sm font-semibold sm:text-xs',
                    isExotic
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-foreground',
                  )}
                >
                  {name}
                </span>
              </>
            ) : (
              <>
                <span
                  className={cn(
                    'truncate text-sm font-bold',
                    isExotic
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-foreground',
                  )}
                >
                  {name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {resolvedSubtitle}
                </span>
              </>
            )}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent className="w-[calc(100vw-2rem)] p-3 sm:w-auto sm:min-w-[280px] sm:max-w-sm">
        {tooltipContent ?? (
          <GearItemDetailsSummary item={item} heading={tooltipHeading} />
        )}
      </TooltipContent>
    </Tooltip>
  );
}
