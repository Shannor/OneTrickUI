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
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {heading}
          </span>
        )}
        <span className="text-xs text-muted-foreground">None equipped</span>
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
    <div className="flex flex-col gap-1.5">
      {heading && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </span>
      )}
      <div className="flex flex-col">
        <span
          className={cn(
            'text-xs font-bold',
            isExotic ? 'text-amber-500 dark:text-amber-400' : 'text-foreground',
          )}
        >
          {name}
        </span>
        {typeName && (
          <span className="text-[11px] text-muted-foreground">{typeName}</span>
        )}
      </div>
      {stats && Object.keys(stats).length > 0 && (
        <div className="min-w-[200px] pt-0.5 text-xs">
          {isArmor ? (
            <ArmorStats stats={stats} />
          ) : (
            <WeaponStats stats={stats} compact={true} />
          )}
        </div>
      )}
      {perks.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {perks.slice(0, 4).map((perk, idx) => (
            <span
              key={`${String(perk.hash)}-${idx}`}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {perk.name}
            </span>
          ))}
        </div>
      )}
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
  const name = getGearItemName(item);
  const iconUrl = getItemIconUrl(item?.details);
  const resolvedSubtitle =
    subtitle ??
    item?.details?.baseInfo?.itemTypeDisplayName ??
    (isExotic ? 'Exotic' : 'Gear');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className={cn(
            'flex min-w-0 items-center gap-2 rounded-md border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            size === 'md' ? 'gap-2.5 rounded-lg p-2 font-medium' : 'px-2.5 py-1.5',
            isExotic
              ? 'border-amber-500/40 bg-amber-500/10 text-foreground hover:bg-amber-500/20 dark:bg-amber-500/15'
              : 'border-border/60 bg-muted/20 text-foreground hover:bg-muted/40',
            className,
          )}
        >
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={name}
              className={cn(
                'shrink-0 rounded border object-cover',
                size === 'md' ? 'h-8 w-8' : 'h-6 w-6',
                isExotic ? 'border-amber-400' : 'border-border/60',
              )}
            />
          ) : (
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded border bg-muted font-bold text-muted-foreground',
                size === 'md' ? 'h-8 w-8 text-xs' : 'h-6 w-6 text-[10px]',
              )}
            >
              {name.charAt(0)}
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {label ? (
              <>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </span>
                <span className="truncate font-semibold">{name}</span>
              </>
            ) : (
              <>
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
                  {resolvedSubtitle}
                </span>
              </>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3">
        {tooltipContent ?? (
          <GearItemDetailsSummary item={item} heading={tooltipHeading} />
        )}
      </TooltipContent>
    </Tooltip>
  );
}
