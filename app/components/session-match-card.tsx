import { ArrowRight, ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Aggregate, CharacterSnapshot } from '~/api';
import { computePlayerCombatStats } from '~/calculations/precision';
import { FormattedDate } from '~/components/formatted-date';
import { HorizontalBanner } from '~/components/horizontal-banner';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import VerticalBanner from '~/components/vertical-banner';
import { WeaponHeader } from '~/components/weapon-header';
import { getWeapons } from '~/hooks/use-loadout';
import { formatActivityLabel } from '~/lib/activity-display';
import { cn } from '~/lib/utils';
import { Performance, type StatItem } from '~/organisims/performance';

export function hasMatchLoadoutConfidence(confidenceLevel?: string): boolean {
  return (
    confidenceLevel === 'high' ||
    confidenceLevel === 'medium' ||
    confidenceLevel === 'low'
  );
}

export interface SessionMatchLoadoutHeaderProps {
  snapshot: CharacterSnapshot;
  loadoutPath: string;
  showWeapons: boolean;
}

export function SessionMatchLoadoutHeader({
  snapshot,
  loadoutPath,
  showWeapons,
}: SessionMatchLoadoutHeaderProps) {
  return (
    <div className="flex flex-col gap-3 pb-2 pt-4">
      <Link
        to={loadoutPath}
        className="group inline-flex min-h-11 w-full touch-manipulation items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3.5 py-2 text-base font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-0 sm:w-fit sm:justify-start sm:rounded-md sm:px-2.5 sm:py-1 sm:text-sm"
      >
        <span className="truncate group-hover:underline">
          {snapshot.name ?? 'Snapshot'}
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary sm:h-3.5 sm:w-3.5" />
      </Link>
      <div
        className={cn('flex flex-row flex-wrap gap-3', {
          hidden: !showWeapons,
        })}
      >
        {getWeapons(snapshot.loadout).map((weapon) => (
          <WeaponHeader
            key={weapon.itemHash}
            properties={weapon.details}
            onlyIcon
          />
        ))}
      </div>
    </div>
  );
}

export interface SessionMatchCardProps {
  aggregate: Aggregate;
  characterId: string;
  activityPath: string;
  onSelect: () => void;
  children?: ReactNode;
}

export function SessionMatchCard({
  aggregate,
  characterId,
  activityPath,
  onSelect,
  children,
}: SessionMatchCardProps) {
  const { activityDetails, performance: performances } = aggregate;
  const performance = performances[characterId];
  const won = performance?.playerStats?.standing?.value === 0;
  const { label: activityLabel, modeLabel } = formatActivityLabel(
    activityDetails.activity,
    activityDetails.mode,
  );

  const stats: StatItem[] = [];
  const kdStats: StatItem[] = [];
  if (performance) {
    const { kills, assists, deaths, kd, efficiency } = computePlayerCombatStats(
      performance.playerStats,
    );
    stats.push(
      { label: 'Kills', value: kills.toString() },
      { label: 'Assists', value: assists.toString() },
      { label: 'Deaths', value: deaths.toString() },
    );
    kdStats.push(
      { label: 'K/D', value: kd.toFixed(2) },
      { label: 'Efficiency', value: efficiency.toFixed(2) },
    );
  }

  return (
    <Card
      className="group w-full min-w-0 cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary hover:shadow-lg"
      onClick={onSelect}
    >
      <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-5 md:p-6">
        <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="hidden flex-row gap-2 md:flex">
            {won ? (
              <VerticalBanner
                label="Victory"
                className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
              />
            ) : (
              <VerticalBanner
                label="Defeat"
                className="bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100"
              />
            )}
            <img
              src={activityDetails.imageUrl}
              className="hidden h-auto w-36 rounded-lg object-cover md:block md:w-28 lg:w-36 xl:w-44"
              alt="activity image"
            />
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-4 md:hidden">
              {won ? (
                <HorizontalBanner
                  label="Victory"
                  className="h-5 bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
                />
              ) : (
                <HorizontalBanner
                  label="Defeat"
                  className="h-5 bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100"
                />
              )}
              <img
                src={activityDetails.imageUrl}
                className="h-28 w-full rounded-lg object-cover md:hidden"
                alt="activity image"
              />
            </div>
            <div className="flex flex-row items-center gap-3">
              <img
                src={activityDetails.activityIcon}
                className="h-12 w-12 shrink-0 rounded-lg bg-black/50 object-cover"
                alt="activity image"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {activityLabel}
                  {modeLabel && <span>{' - ' + modeLabel}</span>}
                </div>
                <h3 className="truncate font-heading text-lg font-bold tracking-wide text-foreground transition-colors group-hover:text-primary sm:text-xl lg:text-2xl">
                  {activityDetails.location}
                </h3>

                <FormattedDate
                  date={activityDetails.period}
                  formatStr="p"
                  fallbackFormatStr="HH:mm"
                  className="text-xs text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:gap-0 md:divide-x md:divide-border/60">
              <Performance stats={stats} className="md:pr-4" />
              <Performance stats={kdStats} className="md:pl-4" />
            </div>
          </div>
        </div>

        {children}

        <div className="flex w-full items-center justify-end">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="min-h-11 w-full touch-manipulation justify-between gap-1.5 px-2 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary md:min-h-9 md:w-auto md:justify-end lg:text-sm"
          >
            <Link
              to={activityPath}
              prefetch="intent"
              onClick={(event) => event.stopPropagation()}
            >
              <span>View Game Details</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1 lg:h-4 lg:w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
