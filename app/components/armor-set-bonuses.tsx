import { ShieldCheckIcon, ShieldIcon } from 'lucide-react';
import type { ArmorSetBonus, ArmorSetBonusPerk } from '~/api';
import { Badge } from '~/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { useTapTooltip } from '~/hooks/use-tap-tooltip';
import { cn, setBungieUrl } from '~/lib/utils';

export function getHighestActiveTier(bonus: ArmorSetBonus): number {
  if (bonus.activePerks && bonus.activePerks.length > 0) {
    return Math.max(...bonus.activePerks.map((perk) => perk.requiredSetCount));
  }
  if (bonus.activeCount >= 4) return 4;
  if (bonus.activeCount >= 2) return 2;
  return bonus.activeCount;
}

export function formatArmorSetBonusLabel(bonus: ArmorSetBonus): string {
  return `${bonus.setName} (${getHighestActiveTier(bonus)}pc)`;
}

export function formatArmorSetBonusSummary(bonuses?: ArmorSetBonus[]): string {
  if (!bonuses || bonuses.length === 0) return 'None';
  return bonuses.map(formatArmorSetBonusLabel).join(' + ');
}

export interface ArmorSetBonusPerkIconProps {
  perk: Pick<ArmorSetBonusPerk, 'iconPath' | 'name'>;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function ArmorSetBonusPerkIcon({
  perk,
  size = 'md',
  className,
}: ArmorSetBonusPerkIconProps) {
  const iconUrl = setBungieUrl(perk.iconPath);
  const sizeClasses =
    size === 'xs'
      ? 'h-4 w-4 p-0.5'
      : size === 'sm'
        ? 'h-6 w-6 p-0.5'
        : 'h-9 w-9 p-1';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded border border-border/60 bg-zinc-900 dark:bg-zinc-800/80',
        sizeClasses,
        className,
      )}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={perk.name}
          className="h-full w-full object-contain"
        />
      ) : (
        <ShieldIcon className="h-3.5 w-3.5 text-zinc-200" />
      )}
    </div>
  );
}

export interface ArmorSetBonusPerkRowProps {
  perk: ArmorSetBonusPerk;
  className?: string;
}

export function ArmorSetBonusPerkRow({
  perk,
  className,
}: ArmorSetBonusPerkRowProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <ArmorSetBonusPerkIcon perk={perk} size="md" className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-foreground sm:text-base">
            {perk.name}
          </span>
          <Badge
            variant="secondary"
            className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
          >
            {perk.requiredSetCount}-Piece
          </Badge>
        </div>
        {perk.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {perk.description}
          </p>
        )}
      </div>
    </div>
  );
}

export interface ArmorSetBonusGroupProps {
  bonus: ArmorSetBonus;
  isSplitSet: boolean;
}

export function ArmorSetBonusGroup({
  bonus,
  isSplitSet,
}: ArmorSetBonusGroupProps) {
  const activePerks = bonus.activePerks ?? [];
  const highestTier = getHighestActiveTier(bonus);
  const hasTwoColumns = !isSplitSet && activePerks.length === 2;

  return (
    <div
      data-testid={`armor-set-bonus-${String(bonus.setHash)}`}
      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3.5 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4 shrink-0 text-primary" />
          <h4 className="truncate font-heading text-xl font-bold tracking-wide text-foreground sm:text-2xl">
            {bonus.setName}
          </h4>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-foreground"
          >
            {highestTier}-Piece Set
          </Badge>
        </div>
      </div>

      {activePerks.length > 0 && (
        <div
          className={cn(
            'grid grid-cols-1 divide-y divide-border/40',
            hasTwoColumns && 'md:grid-cols-2 md:divide-x md:divide-y-0',
          )}
        >
          {activePerks.map((perk, idx) => (
            <ArmorSetBonusPerkRow
              key={`${String(perk.hash)}-${perk.requiredSetCount}`}
              perk={perk}
              className={cn(
                idx > 0 && 'pt-3',
                idx < activePerks.length - 1 && 'pb-3',
                hasTwoColumns &&
                  (idx % 2 === 0
                    ? 'md:pb-0 md:pr-5 md:pt-0'
                    : 'md:pb-0 md:pl-5 md:pt-0'),
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface ArmorSetBonusesPanelProps {
  bonuses?: ArmorSetBonus[];
  className?: string;
}

export function ArmorSetBonusesPanel({
  bonuses,
  className,
}: ArmorSetBonusesPanelProps) {
  if (!bonuses || bonuses.length === 0) return null;

  const isSplitSet = bonuses.length > 1;

  return (
    <section
      aria-label="Active Set Bonuses"
      data-testid="active-set-bonuses"
      className={cn('flex w-full flex-col gap-2.5', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
            Active Set Bonuses
          </span>
          {isSplitSet && (
            <Badge
              variant="secondary"
              className="px-2 py-0.5 text-xs font-semibold"
            >
              {bonuses.length} Active Sets
            </Badge>
          )}
        </div>
      </div>

      <div
        className={cn('grid grid-cols-1 gap-3', isSplitSet && 'lg:grid-cols-2')}
      >
        {bonuses.map((bonus) => (
          <ArmorSetBonusGroup
            key={String(bonus.setHash)}
            bonus={bonus}
            isSplitSet={isSplitSet}
          />
        ))}
      </div>
    </section>
  );
}

export interface ArmorSetBonusTooltipDetailsProps {
  bonuses?: ArmorSetBonus[];
  heading?: string;
}

export function ArmorSetBonusTooltipDetails({
  bonuses,
  heading,
}: ArmorSetBonusTooltipDetailsProps) {
  if (!bonuses || bonuses.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        {heading && (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {heading}
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          No active set bonuses
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {heading && (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </span>
      )}
      {bonuses.map((bonus) => {
        const highestTier = getHighestActiveTier(bonus);

        return (
          <div
            key={String(bonus.setHash)}
            className="flex min-w-0 flex-col gap-2"
          >
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-bold text-foreground">
                {bonus.setName}
              </span>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {highestTier}-Piece Set
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              {(bonus.activePerks ?? []).map((perk) => (
                <div
                  key={`${String(perk.hash)}-${perk.requiredSetCount}`}
                  className="flex min-w-0 items-start gap-2.5"
                >
                  <ArmorSetBonusPerkIcon
                    perk={perk}
                    size="sm"
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground sm:text-sm">
                        {perk.name}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                        {perk.requiredSetCount}-Piece
                      </span>
                    </div>
                    {perk.description && (
                      <p className="break-words text-xs leading-snug text-muted-foreground">
                        {perk.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface ArmorSetBonusPillProps {
  bonus: ArmorSetBonus;
  size?: 'sm' | 'md';
  className?: string;
}

export function ArmorSetBonusPill({
  bonus,
  size = 'md',
  className,
}: ArmorSetBonusPillProps) {
  const { open, onOpenChange, triggerProps, contentProps } = useTapTooltip();
  const highestTier = getHighestActiveTier(bonus);
  const featuredPerk =
    bonus.activePerks?.[bonus.activePerks.length - 1] ?? bonus.activePerks?.[0];

  return (
    <Tooltip open={open} onOpenChange={onOpenChange}>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-testid={`armor-set-bonus-pill-${String(bonus.setHash)}`}
          {...triggerProps}
          className={cn(
            'inline-flex max-w-full cursor-pointer touch-manipulation select-none items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 font-semibold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            size === 'sm'
              ? 'min-h-7 px-2.5 py-1 text-xs sm:min-h-0 sm:px-2 sm:py-0.5 sm:text-[11px]'
              : 'min-h-8 px-2.5 py-1 text-xs sm:min-h-0 sm:px-2.5 sm:py-1 sm:text-xs',
            className,
          )}
        >
          {featuredPerk ? (
            <ArmorSetBonusPerkIcon
              perk={featuredPerk}
              size="xs"
              className="rounded-full border-primary/40"
            />
          ) : (
            <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          <span className="truncate">{bonus.setName}</span>
          <span className="shrink-0 font-mono text-[11px] font-bold text-primary sm:text-[10px]">
            ({highestTier}pc)
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        {...contentProps}
        className="w-[calc(100vw-2rem)] p-3 sm:w-auto sm:max-w-sm"
      >
        <ArmorSetBonusTooltipDetails bonuses={[bonus]} />
      </TooltipContent>
    </Tooltip>
  );
}

export interface NoArmorSetBonusPillProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function NoArmorSetBonusPill({
  size = 'md',
  className,
}: NoArmorSetBonusPillProps) {
  return (
    <span
      data-testid="no-armor-set-bonus-pill"
      className={cn(
        'inline-flex max-w-full select-none items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 font-medium text-muted-foreground',
        size === 'sm'
          ? 'min-h-7 px-2.5 py-1 text-xs sm:min-h-0 sm:px-2 sm:py-0.5 sm:text-[11px]'
          : 'min-h-8 px-2.5 py-1 text-xs sm:min-h-0 sm:px-2.5 sm:py-1 sm:text-xs',
        className,
      )}
    >
      <ShieldIcon className="h-3.5 w-3.5 shrink-0 opacity-70 sm:h-3 sm:w-3" />
      <span className="truncate">No Set Bonus</span>
    </span>
  );
}
