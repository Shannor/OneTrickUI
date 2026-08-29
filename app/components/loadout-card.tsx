import {
  ArrowRightIcon,
  CrosshairIcon,
  Gamepad2Icon,
  SwordsIcon,
  TrophyIcon,
} from 'lucide-react';
import type { CharacterSnapshot } from '~/api';
import { ArmorStats } from '~/components/armor-stats';
import { SubClassHeader } from '~/components/sub-class/header';
import { Card, CardContent } from '~/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { WeaponStats } from '~/components/weapon-stats';
import { getDetailWeapons, getExotic } from '~/hooks/use-loadout';
import { cn, setBungieUrl } from '~/lib/utils';
import { SubClassProvider } from '~/providers/sub-class-provider';

export interface LoadoutCardProps {
  snapshot: CharacterSnapshot;
  stats?: {
    kd?: { value?: number };
    kda?: { value?: number };
    standing?: { value?: number };
  };
  gamesCount?: number;
  onClick?: () => void;
  className?: string;
}

export function LoadoutCard({
  snapshot,
  stats,
  gamesCount = 0,
  onClick,
  className,
}: LoadoutCardProps) {
  return (
    <TooltipProvider font-sans>
      <Card
        className={cn(
          'group w-full min-w-0 cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary hover:shadow-lg',
          className,
        )}
        onClick={onClick}
      >
        <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-5 md:p-6 lg:p-7">
          <LoadoutCardHeader snapshot={snapshot} />
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
}: {
  snapshot: CharacterSnapshot;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 border-b border-border/50 pb-3.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="truncate text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl lg:text-2xl">
          {snapshot.name || 'Loadout'}
        </h3>
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
          const isExotic =
            item.details?.baseInfo?.tierTypeName?.toLowerCase() === 'exotic';
          const iconUrl = setBungieUrl(item.details?.baseInfo?.icon);
          const name = item.details?.baseInfo?.name || 'Gear Item';
          const typeName =
            item.details?.baseInfo?.itemTypeDisplayName ||
            (isExotic ? 'Exotic' : 'Gear');

          return (
            <Tooltip key={`${item.itemHash}-${name}`}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex min-w-0 items-center gap-2.5 rounded-lg border p-2 text-xs font-medium transition-colors',
                    isExotic
                      ? 'border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15'
                      : 'border-border/60 bg-muted/20 hover:bg-muted/40',
                  )}
                >
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
              </TooltipTrigger>
              <TooltipContent className="flex flex-col gap-2">
                <span className={cn('font-bold', isExotic && 'text-amber-400')}>
                  {name}
                </span>
                {item.details?.stats &&
                  ('armor' in item ? (
                    <ArmorStats stats={item.details.stats} />
                  ) : (
                    <WeaponStats stats={item.details.stats} />
                  ))}
              </TooltipContent>
            </Tooltip>
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
