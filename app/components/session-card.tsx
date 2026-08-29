import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CrosshairIcon,
  Gamepad2Icon,
  RadioIcon,
  SwordsIcon,
  TrophyIcon,
} from 'lucide-react';
import type { Session, SessionSummary, SessionWeaponSummary } from '~/api';
import { SessionDate } from '~/components/session-date';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn, setBungieUrl } from '~/lib/utils';

export interface SessionCardProps {
  onClick: () => void | Promise<void>;
  session: Session;
  classname?: string;
}

export function SessionCard({ session, classname, onClick }: SessionCardProps) {
  const isPending = session.status === 'pending';
  const hasSummary = Boolean(session.summary);

  return (
    <Card
      className={cn(
        'group w-full min-w-0 cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary hover:shadow-lg',
        classname,
      )}
      onClick={onClick}
    >
      <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-5 md:p-6 lg:p-7">
        <SessionCardHeader session={session} isPending={isPending} />

        {hasSummary && session.summary ? (
          <SessionCardSummary summary={session.summary} />
        ) : (
          <SessionCardFallback session={session} />
        )}

        <SessionCardFooter isPending={isPending} />
      </CardContent>
    </Card>
  );
}

export function SessionCardHeader({
  session,
  isPending,
}: {
  session: Session;
  isPending: boolean;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 border-b border-border/50 pb-3.5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl lg:text-2xl">
            {session.name ||
              (isPending ? 'Active Session' : 'Completed Session')}
          </h3>
          {session.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm lg:text-base">
              {session.description}
            </p>
          )}
        </div>

        {isPending ? (
          <Badge className="shrink-0 animate-pulse gap-1 bg-primary px-2.5 py-0.5 text-xs text-primary-foreground lg:px-3 lg:py-1 lg:text-sm">
            <RadioIcon className="h-3 w-3 lg:h-4 lg:w-4" />
            Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="shrink-0 gap-1 px-2.5 py-0.5 text-xs lg:px-3 lg:py-1 lg:text-sm"
          >
            <CheckCircle2Icon className="h-3 w-3 text-muted-foreground lg:h-4 lg:w-4" />
            Completed
          </Badge>
        )}
      </div>

      <SessionDate
        startedAt={session.startedAt}
        completedAt={session.completedAt}
      />
    </div>
  );
}

export function SessionCardSummary({ summary }: { summary: SessionSummary }) {
  const totalMatches = summary.totalMatches ?? 0;
  const wins = summary.wins ?? 0;
  const losses =
    summary.losses ?? (totalMatches > wins ? totalMatches - wins : 0);

  const rawWinRate = summary.winRate;
  const calculatedWinRate =
    rawWinRate === undefined
      ? totalMatches > 0
        ? Math.round((wins / totalMatches) * 100)
        : 0
      : rawWinRate <= 1
        ? Math.round(rawWinRate * 100)
        : Math.round(rawWinRate);

  const isPositiveWinRate = calculatedWinRate >= 50;
  const hasModes = Boolean(
    summary.modesPlayed && summary.modesPlayed.length > 0,
  );
  const hasWeapons = Boolean(
    summary.topWeapons && summary.topWeapons.length > 0,
  );
  const hasContext = hasModes || hasWeapons || summary.kills != null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 lg:gap-5">
      <div className="grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 md:divide-x md:divide-border/60">
        <div className="flex min-w-0 flex-col gap-1 md:pr-4 lg:pr-6">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-sm">
            <Gamepad2Icon className="h-3.5 w-3.5 shrink-0 text-primary lg:h-4 lg:w-4" />
            Matches
          </span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-heading text-xl font-extrabold tracking-wide text-foreground sm:text-2xl lg:text-3xl">
              {totalMatches}
            </span>
            <span className="text-xs font-medium text-muted-foreground lg:text-sm">
              {`(${wins}W - ${losses}L)`}
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
              {calculatedWinRate}%
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

        <div className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1 md:px-4 lg:px-6">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:text-sm">
            <CrosshairIcon className="h-3.5 w-3.5 shrink-0 text-primary lg:h-4 lg:w-4" />
            K / D
          </span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-heading text-xl font-extrabold tracking-wide text-foreground sm:text-2xl lg:text-3xl">
              {summary.kdRatio == null ? '--' : summary.kdRatio.toFixed(2)}
            </span>
            {summary.kdaRatio != null && (
              <span className="text-xs text-muted-foreground lg:text-sm">
                ({summary.kdaRatio.toFixed(2)} KDA)
              </span>
            )}
          </div>
        </div>
      </div>

      {hasContext && (
        <div className="flex w-full min-w-0 flex-col gap-3 border-t border-border/50 pt-3.5 md:grid md:grid-cols-2 md:gap-6 lg:gap-8">
          {hasModes && <SessionCardModes modes={summary.modesPlayed!} />}

          {hasWeapons ? (
            <SessionCardTopWeapons weapons={summary.topWeapons!} />
          ) : summary.kills == null ? null : (
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground lg:text-sm">
                K/D/A Breakdown
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground lg:text-sm">
                <SwordsIcon className="h-3.5 w-3.5 shrink-0 text-primary lg:h-4 lg:w-4" />
                <span className="truncate">
                  {summary.kills ?? 0} K / {summary.deaths ?? 0} D /{' '}
                  {summary.assists ?? 0} A
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SessionCardModes({ modes }: { modes: string[] }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5 md:gap-2">
      <span className="text-xs font-semibold text-muted-foreground md:text-sm lg:text-base">
        Modes:
      </span>
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 lg:gap-2.5">
        {modes.map((mode) => (
          <Badge
            key={mode}
            variant="secondary"
            className="w-fit max-w-[160px] shrink-0 truncate px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider md:px-2.5 md:py-1 md:text-xs lg:px-3 lg:py-1 lg:text-xs"
          >
            {mode}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function SessionCardTopWeapons({
  weapons,
}: {
  weapons: SessionWeaponSummary[];
}) {
  return (
    <TooltipProvider font-sans>
      <div className="flex w-full min-w-0 flex-col gap-1.5 md:gap-2">
        <span className="text-xs font-semibold text-muted-foreground md:text-sm lg:text-base">
          Top Guns:
        </span>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 lg:gap-4">
          {weapons.slice(0, 3).map((weapon, idx) => {
            const iconUrl = setBungieUrl(weapon.icon);
            const name = weapon.name || 'Weapon';
            return (
              <Tooltip key={weapon.name || idx}>
                <TooltipTrigger asChild>
                  <div className="flex min-w-0 shrink-0 items-center gap-1.5 text-xs font-medium md:text-sm lg:text-base">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={name}
                        className="h-4 w-4 shrink-0 rounded object-cover md:h-6 md:w-6 lg:h-8 lg:w-8"
                      />
                    ) : null}
                    <span className="max-w-[100px] truncate text-[11px] font-semibold md:max-w-[140px] md:text-xs lg:max-w-[180px] lg:text-sm">
                      {name}
                    </span>
                    {weapon.kills != null && (
                      <span className="shrink-0 text-[10px] text-muted-foreground md:text-xs lg:text-sm">
                        ({weapon.kills})
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs lg:text-sm">
                    {name}{' '}
                    {weapon.kills == null ? '' : `- ${weapon.kills} Kills`}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

export function SessionCardFallback({ session }: { session: Session }) {
  const gamesCount = session.aggregateIds?.length ?? 0;

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground lg:text-base">
      <Gamepad2Icon className="h-4 w-4 shrink-0 text-primary lg:h-5 lg:w-5" />
      <span>Matches:</span>
      <span className="font-heading text-lg font-bold text-foreground">
        {gamesCount}
      </span>
    </div>
  );
}

export function SessionCardFooter({ isPending }: { isPending: boolean }) {
  return (
    <div className="flex min-w-0 items-center justify-end gap-1.5 text-xs font-semibold text-primary transition-all group-hover:translate-x-0.5 lg:text-sm">
      <span className="truncate">
        {isPending ? 'View Active Session' : 'View Session Summary'}
      </span>
      <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1 lg:h-4 lg:w-4" />
    </div>
  );
}
