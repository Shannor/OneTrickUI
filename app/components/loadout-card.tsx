import {
  ArrowRightIcon,
  CrosshairIcon,
  Gamepad2Icon,
  LayersIcon,
  SwordsIcon,
  TrophyIcon,
} from 'lucide-react';
import type { CharacterSnapshot } from '~/api';
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
  className?: string;
}

export function LoadoutCard({
  snapshot,
  stats,
  gamesCount = 0,
  similarCount = 0,
  onSimilarClick,
  onClick,
  className,
}: LoadoutCardProps) {
  return (
    <TooltipProvider>
      <Card
        tabIndex={onClick ? 0 : undefined}
        className={cn(
          'group w-full min-w-0 cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
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
        <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-5 md:p-6 lg:p-7">
          <LoadoutCardHeader
            snapshot={snapshot}
            similarCount={similarCount}
            onSimilarClick={onSimilarClick}
          />
          <LoadoutCardSummary stats={stats} gamesCount={gamesCount} />
          <LoadoutCardGear snapshot={snapshot} />
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
}: {
  snapshot: CharacterSnapshot;
  similarCount?: number;
  onSimilarClick?: (snapshot: CharacterSnapshot) => void;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 border-b border-border/50 pb-3.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex w-full items-center justify-between gap-2">
          <h3 className="truncate text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl lg:text-2xl">
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
                className="h-7 gap-1.5 rounded-full px-2.5 text-xs font-semibold"
              >
                <LayersIcon className="h-3.5 w-3.5 text-primary" />
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
          <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm lg:text-base">
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
}: {
  stats?: {
    kd?: { value?: number };
    kda?: { value?: number };
    standing?: { value?: number };
  };
  gamesCount: number;
}) {
  const kd = stats?.kd?.value ?? 0;
  const kda = stats?.kda?.value ?? 0;
  const winRatio = stats?.standing?.value ?? 0;
  const winPercentage = Math.round(winRatio * 100);
  const isPositiveWinRate = winRatio >= 0.5;

  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 md:divide-x md:divide-border/60">
      <div className="flex min-w-0 flex-col gap-1 md:pr-4 lg:pr-6">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-sm">
          <Gamepad2Icon className="h-3.5 w-3.5 shrink-0 text-primary lg:h-4 lg:w-4" />
          Games
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-xl font-extrabold tracking-wide text-foreground sm:text-2xl lg:text-3xl">
            {gamesCount}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1 md:px-4 lg:px-6">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-sm">
          <TrophyIcon className="h-3.5 w-3.5 shrink-0 text-primary lg:h-4 lg:w-4" />
          Win Rate
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-xl font-extrabold tracking-wide text-foreground sm:text-2xl lg:text-3xl">
            {winPercentage}%
          </span>
          <span
            className={cn(
              'text-xs font-semibold lg:text-sm',
              isPositiveWinRate
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400',
            )}
          >
            {isPositiveWinRate ? 'Positive' : 'Negative'}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1 md:px-4 lg:px-6">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-sm">
          <CrosshairIcon className="h-3.5 w-3.5 shrink-0 text-primary lg:h-4 lg:w-4" />
          K / D
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-xl font-extrabold tracking-wide text-foreground sm:text-2xl lg:text-3xl">
            {kd.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1 md:px-4 lg:px-6">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-sm">
          <SwordsIcon className="h-3.5 w-3.5 shrink-0 text-primary lg:h-4 lg:w-4" />
          Efficiency
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-xl font-extrabold tracking-wide text-foreground sm:text-2xl lg:text-3xl">
            {kda.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LoadoutCardGear({ snapshot }: { snapshot: CharacterSnapshot }) {
  const weapons = getDetailWeapons(snapshot.loadout);
  const { armor: exoticArmor } = getExotic(snapshot.loadout);

  const gearItems = [...weapons, ...(exoticArmor ? [exoticArmor] : [])];

  if (gearItems.length === 0) return null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 border-t border-border/50 pt-3.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-sm">
        Gear & Weapons
      </span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {gearItems.map((item) => {
          const isExotic = isExoticItem(item);
          const name = item.details?.baseInfo?.name || 'Gear Item';

          return (
            <GearItemPill
              key={`${item.itemHash}-${name}`}
              item={item}
              size="md"
              highlight={isExotic}
              tooltipContent={
                <div className="flex flex-col gap-2">
                  <span
                    className={cn('font-bold', isExotic && 'text-amber-400')}
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

export function LoadoutCardFooter() {
  return (
    <div className="flex min-w-0 items-center justify-end gap-1.5 border-t border-border/40 pt-3 text-xs font-semibold text-primary transition-all group-hover:translate-x-0.5 lg:text-sm">
      <span className="truncate">View Loadout Details</span>
      <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1 lg:h-4 lg:w-4" />
    </div>
  );
}
