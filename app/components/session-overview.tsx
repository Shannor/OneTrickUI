import {
  CrosshairIcon,
  Gamepad2Icon,
  SwordsIcon,
  TrophyIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import type { Aggregate, Session } from '~/api';
import { ChartWrapper } from '~/charts/ChartWrapper';
import { KDPerformance } from '~/charts/KDPerformance';
import { SessionCompTrackingBanner } from '~/components/comp-tracking';
import { TooltipProvider } from '~/components/ui/tooltip';
import {
  generateKDAResultsForTimeWindow,
  timeWindowToCustom,
} from '~/lib/metrics';
import { cn } from '~/lib/utils';

export interface SessionOverviewProps {
  session: Session;
  aggregates?: Aggregate[];
  characterId: string;
  className?: string;
}

export function SessionOverview({
  session,
  aggregates = [],
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
  const isPending = session.status === 'pending';

  return (
    <TooltipProvider font-sans>
      <div className={cn('flex w-full flex-col gap-6', className)}>
        <SessionCompTrackingBanner
          compTracking={session.compTracking}
          isPending={isPending}
        />

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
