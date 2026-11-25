import {
  ArrowRightIcon,
  CrosshairIcon,
  Gamepad2Icon,
  LayersIcon,
  SwordsIcon,
  TrophyIcon,
} from 'lucide-react';
import type { CharacterSnapshot } from '~/api';
import { ArmorSetBonusPill } from '~/components/armor-set-bonuses';
import { ArmorStats } from '~/components/armor-stats';
import { FormattedDate } from '~/components/formatted-date';
import { GearItemPill, hasArmorStats } from '~/components/gear-item-pill';
import { SubClassHeader } from '~/components/sub-class/header';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { TooltipProvider } from '~/components/ui/tooltip';
import { WeaponStats } from '~/components/weapon-stats';
import { getDetailWeapons, getExotic, isExoticItem } from '~/hooks/use-loadout';
import { cn } from '~/lib/utils';
import { SubClassProvider } from '~/providers/sub-class-provider';

export interface LoadoutCardProps {
  snapshot: CharacterSnapshot;
  stats?: {
    kd?: { value?: number };
    kda?: { value?: number };
    standing?: { value?: number };
  };
  gamesCount?: number;
  similarCount?: number;
  onSimilarClick?: (snapshot: CharacterSnapshot) => void;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

export function LoadoutCard({
  snapshot,
  stats,
  gamesCount = 0,
  similarCount = 0,
  onSimilarClick,
  onClick,
  compact = false,
  className,
}: LoadoutCardProps) {
  return (
    <TooltipProvider>
      <Card
        tabIndex={onClick ? 0 : undefined}
        className={cn(
          'group flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden border transition-all duration-200 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          className,
        )}
        onClick={onClick}
        onKeyDown={(e) => {
          if (
            onClick &&
            e.target === e.currentTarget &&
            (e.key === 'Enter' || e.key === ' ')
          ) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <CardContent
          className={cn(
            'flex h-full w-full min-w-0 flex-1 flex-col justify-between',
            compact ? 'gap-3.5 p-4 sm:p-5' : 'gap-4 p-4 sm:p-5 md:p-6 lg:p-7',
          )}
        >
          <div className="flex w-full min-w-0 flex-col gap-3.5">
            <LoadoutCardHeader
              snapshot={snapshot}
              similarCount={similarCount}
              onSimilarClick={onSimilarClick}
              compact={compact}
            />
            <LoadoutCardSummary
              stats={stats}
              gamesCount={gamesCount}
              compact={compact}
            />
            <LoadoutCardGear snapshot={snapshot} compact={compact} />
            <LoadoutCardSetBonuses snapshot={snapshot} compact={compact} />
          </div>
          <LoadoutCardFooter />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export function LoadoutCardHeader({
  snapshot,
  similarCount = 0,
  onSimilarClick,
  compact = false,
}: {
  snapshot: CharacterSnapshot;
  similarCount?: number;
  onSimilarClick?: (snapshot: CharacterSnapshot) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2.5 border-b border-border/50 pb-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <h3
            className={cn(
              'min-w-0 flex-1 truncate font-bold tracking-tight text-foreground transition-colors group-hover:text-primary',
              compact
                ? 'text-xl sm:text-2xl'
                : 'text-xl sm:text-2xl lg:text-3xl',
            )}
          >
            {snapshot.name || 'Loadout'}
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            {similarCount > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                data-testid="similar-loadouts-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  onSimilarClick?.(snapshot);
                }}
                className="min-h-10 touch-manipulation gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold sm:min-h-9 sm:text-sm"
              >
                <LayersIcon className="h-4 w-4 text-primary" />
                <span>{similarCount} Similar</span>
              </Button>
            )}
            {snapshot.createdAt && (
              <span className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                <FormattedDate
                  date={snapshot.createdAt}
                  formatStr="MMM d, yyyy"
                />
              </span>
            )}
          </div>
        </div>
        {snapshot.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground sm:text-base">
            {snapshot.description}
          </p>
        )}
      </div>
      <SubClassProvider snapshot={snapshot}>
        <SubClassHeader />
      </SubClassProvider>
    </div>
  );
}

export function LoadoutCardSummary({
  stats,
  gamesCount,
  compact = false,
}: {
  stats?: {
    kd?: { value?: number };
    kda?: { value?: number };
    standing?: { value?: number };
  };
  gamesCount: number;
  compact?: boolean;
}) {
  const kd = stats?.kd?.value ?? 0;
  const kda = stats?.kda?.value ?? 0;
  const winRatio = stats?.standing?.value ?? 0;
  const winPercentage = Math.round(winRatio * 100);
  const isPositiveWinRate = winRatio >= 0.5;

  return (
    <div
      className={cn(
        'grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-3',
        !compact && 'sm:grid-cols-4 md:divide-x md:divide-border/60',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-col gap-0.5',
          !compact && 'md:pr-4 lg:pr-6',
        )}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          <Gamepad2Icon className="h-4 w-4 shrink-0 text-primary" />
          Games
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className={cn(
              'font-heading font-extrabold tracking-wide text-foreground',
              compact
                ? 'text-2xl sm:text-2xl'
                : 'text-2xl sm:text-2xl lg:text-3xl',
            )}
          >
            {gamesCount}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-col gap-0.5',
          !compact && 'md:px-4 lg:px-6',
        )}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          <TrophyIcon className="h-4 w-4 shrink-0 text-primary" />
          Win Rate
        </span>
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span
            className={cn(
              'font-heading font-extrabold tracking-wide text-foreground',
              compact
                ? 'text-2xl sm:text-2xl'
                : 'text-2xl sm:text-2xl lg:text-3xl',
            )}
          >
            {winPercentage}%
          </span>
          <span
            className={cn(
              'text-xs font-semibold sm:text-sm',
              isPositiveWinRate
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400',
            )}
          >
            {isPositiveWinRate ? 'Positive' : 'Negative'}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-col gap-0.5',
          !compact && 'md:px-4 lg:px-6',
        )}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          <CrosshairIcon className="h-4 w-4 shrink-0 text-primary" />K / D
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className={cn(
              'font-heading font-extrabold tracking-wide text-foreground',
              compact
                ? 'text-2xl sm:text-2xl'
                : 'text-2xl sm:text-2xl lg:text-3xl',
            )}
          >
            {kd.toFixed(2)}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-col gap-0.5',
          !compact && 'md:px-4 lg:px-6',
        )}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
          <SwordsIcon className="h-4 w-4 shrink-0 text-primary" />
          Efficiency
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className={cn(
              'font-heading font-extrabold tracking-wide text-foreground',
              compact
                ? 'text-2xl sm:text-2xl'
                : 'text-2xl sm:text-2xl lg:text-3xl',
            )}
          >
            {kda.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LoadoutCardGear({
  snapshot,
  compact = false,
}: {
  snapshot: CharacterSnapshot;
  compact?: boolean;
}) {
  const weapons = getDetailWeapons(snapshot.loadout);
  const { armor: exoticArmor } = getExotic(snapshot.loadout);

  const gearItems = [...weapons, ...(exoticArmor ? [exoticArmor] : [])];

  if (gearItems.length === 0) return null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2.5 border-t border-border/50 pt-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
        Gear & Weapons
      </span>
      <div
        className={cn(
          'grid grid-cols-1 gap-2.5 sm:grid-cols-2',
          !compact && 'lg:grid-cols-4',
        )}
      >
        {gearItems.map((item) => {
          const isExotic = isExoticItem(item);
          const name = item.details?.baseInfo?.name || 'Gear Item';

          return (
            <GearItemPill
              key={`${item.itemHash}-${name}`}
              item={item}
              size={compact ? 'sm' : 'md'}
              highlight={isExotic}
              tooltipContent={
                <div className="flex flex-col gap-2">
                  <span
                    className={cn(
                      'text-sm font-bold',
                      isExotic && 'text-amber-400',
                    )}
                  >
                    {name}
                  </span>
                  {item.details?.stats &&
                    (hasArmorStats(item) ? (
                      <ArmorStats stats={item.details.stats} />
                    ) : (
                      <WeaponStats stats={item.details.stats} />
                    ))}
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
}

export function LoadoutCardSetBonuses({
  snapshot,
  compact = false,
}: {
  snapshot: CharacterSnapshot;
  compact?: boolean;
}) {
  const bonuses = snapshot.armorSetBonuses;
  if (!bonuses || bonuses.length === 0) return null;

  return (
    <div
      data-testid="loadout-card-set-bonuses"
      className="flex w-full min-w-0 flex-wrap items-center gap-2 border-t border-border/50 pt-3"
    >
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
        Set Bonuses
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {bonuses.map((bonus) => (
          <ArmorSetBonusPill
            key={String(bonus.setHash)}
            bonus={bonus}
            size={compact ? 'sm' : 'md'}
          />
        ))}
      </div>
    </div>
  );
}

export function LoadoutCardFooter() {
  return (
    <div className="flex min-h-9 min-w-0 items-center justify-end gap-1.5 border-t border-border/40 pt-3 text-sm font-semibold text-primary transition-all group-hover:translate-x-0.5">
      <span className="truncate">View Loadout Details</span>
      <ArrowRightIcon className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
    </div>
  );
}
