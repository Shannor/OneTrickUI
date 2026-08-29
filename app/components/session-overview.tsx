import {
  CrosshairIcon,
  Gamepad2Icon,
  ShieldIcon,
  SparklesIcon,
  SwordsIcon,
  TrophyIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import type { Aggregate, CharacterSnapshot, Session } from '~/api';
import { ChartWrapper } from '~/charts/ChartWrapper';
import { ClassStats } from '~/charts/ClassStats';
import { ClassStatsRadar } from '~/charts/ClassStatsRadar';
import { KDPerformance } from '~/charts/KDPerformance';
import { ArmorSet } from '~/components/armor-set';
import { SubClassHeader } from '~/components/sub-class/header';
import { TooltipProvider } from '~/components/ui/tooltip';
import { useClassStats } from '~/hooks/use-loadout';
import {
  generateKDAResultsForTimeWindow,
  timeWindowToCustom,
} from '~/lib/metrics';
import { cn } from '~/lib/utils';
import { SubClassProvider } from '~/providers/sub-class-provider';

export interface SessionOverviewProps {
  session: Session;
  aggregates?: Aggregate[];
  snapshots?: Record<string, CharacterSnapshot>;
  characterId: string;
  className?: string;
}

export function SessionOverview({
  session,
  aggregates = [],
  snapshots = {},
  characterId,
  className,
}: SessionOverviewProps) {
  const customTime = useMemo(() => {
    return timeWindowToCustom('all-time', aggregates);
  }, [aggregates]);

  const kdaData = useMemo(() => {
    if (!aggregates || aggregates.length === 0) return [];
    return generateKDAResultsForTimeWindow(aggregates, customTime, characterId);
  }, [aggregates, customTime, characterId]);

  const summary = useMemo(() => {
    if (!aggregates || aggregates.length === 0) return null;
    return aggregates.reduce(
      (acc, agg) => {
        const p = agg.performance[characterId];
        if (!p) return acc;
        acc.kills += p.playerStats.kills?.value ?? 0;
        acc.deaths += p.playerStats.deaths?.value ?? 0;
        acc.assists += p.playerStats.assists?.value ?? 0;
        acc.wins += p.playerStats.standing?.value === 0 ? 1 : 0;
        acc.games += 1;
        return acc;
      },
      { kills: 0, deaths: 0, assists: 0, wins: 0, games: 0 },
    );
  }, [aggregates, characterId]);

  const activeSnapshot = useMemo(() => {
    if (!snapshots || Object.keys(snapshots).length === 0) return null;
    if (aggregates && aggregates.length > 0) {
      const sorted = [...aggregates].sort(
        (a, b) =>
          new Date(b.activityDetails.period).getTime() -
          new Date(a.activityDetails.period).getTime(),
      );
      for (const agg of sorted) {
        const link = agg.snapshotLinks[characterId];
        if (link?.snapshotId && snapshots[link.snapshotId]) {
          return snapshots[link.snapshotId];
        }
      }
    }
    return Object.values(snapshots)[0];
  }, [aggregates, snapshots, characterId]);

  const classStatValues = useMemo(() => {
    if (!activeSnapshot) return [];
    return useClassStats(activeSnapshot);
  }, [activeSnapshot]);

  const gamesCount = summary?.games ?? session.aggregateIds?.length ?? 0;
  const wins = summary?.wins ?? 0;
  const losses = gamesCount - wins;
  const winRate = gamesCount > 0 ? Math.round((wins / gamesCount) * 100) : 0;
  const isPositiveWinRate = winRate >= 50;
  const kd = summary
    ? summary.deaths > 0
      ? summary.kills / summary.deaths
      : summary.kills
    : 0;
  const kda = summary
    ? summary.deaths > 0
      ? (summary.kills + summary.assists) / summary.deaths
      : summary.kills + summary.assists
    : 0;

  return (
    <TooltipProvider font-sans>
      <div className={cn('flex w-full flex-col gap-6', className)}>
        {summary && (
          <SessionOverviewStats
            gamesCount={gamesCount}
            wins={wins}
            losses={losses}
            winRate={winRate}
            isPositiveWinRate={isPositiveWinRate}
            kd={kd}
            kda={kda}
          />
        )}

        {kdaData.length > 0 && (
          <ChartWrapper
            title="Session Performance Graph"
            description="K/D ratio and Efficiency trend over the course of this session."
          >
            <KDPerformance
              data={kdaData}
              timeWindow={customTime}
              syncId="session-performance"
              className="max-h-[300px]"
            />
          </ChartWrapper>
        )}

        {activeSnapshot && (
          <SessionOverviewClassDetails
            snapshot={activeSnapshot}
            classStatValues={classStatValues}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export function SessionOverviewStats({
  gamesCount,
  wins,
  losses,
  winRate,
  isPositiveWinRate,
  kd,
  kda,
}: {
  gamesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  isPositiveWinRate: boolean;
  kd: number;
  kda: number;
}) {
  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-3 rounded-lg border bg-card p-4 sm:grid-cols-4 md:divide-x md:divide-border/60">
      <div className="flex min-w-0 flex-col gap-1 md:pr-4 lg:pr-6">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-sm">
          <Gamepad2Icon className="h-3.5 w-3.5 shrink-0 text-primary lg:h-4 lg:w-4" />
          Matches
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-xl font-extrabold tracking-wide text-foreground sm:text-2xl lg:text-3xl">
            {gamesCount}
          </span>
          <span className="text-xs font-medium text-muted-foreground lg:text-sm">
            ({wins}W - {losses}L)
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
            {winRate}%
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

export function SessionOverviewClassDetails({
  snapshot,
  classStatValues,
}: {
  snapshot: CharacterSnapshot;
  classStatValues: { stat: string; value: number }[];
}) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-1 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <SparklesIcon className="h-4 w-4 text-primary" />
          Class & Armor Loadout
        </div>
      </div>

      <SubClassProvider snapshot={snapshot}>
        <SubClassHeader />
      </SubClassProvider>

      {classStatValues.length > 0 && (
        <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldIcon className="h-4 w-4 text-primary" />
            Class Stats Overview
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
            <ClassStats data={classStatValues} compact={false} />
            <ClassStatsRadar data={classStatValues} className="max-h-[220px]" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ShieldIcon className="h-4 w-4 text-primary" />
          Armor Pieces & Mods
        </div>
        <ArmorSet snapshot={snapshot} />
      </div>
    </div>
  );
}
