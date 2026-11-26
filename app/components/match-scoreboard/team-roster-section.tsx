import type { ReactNode } from 'react';
import { Badge } from '~/components/ui/badge';
import type { ScoreboardTeamTone } from '~/lib/match-scoreboard';
import { cn } from '~/lib/utils';

export interface TeamRosterSectionProps {
  label: string;
  teamTone: ScoreboardTeamTone;
  standing?: string;
  score?: string;
  playerCount: number;
  children: ReactNode;
}

function getTeamLabelClass(teamTone: ScoreboardTeamTone): string {
  if (teamTone === 'alpha') {
    return 'text-blue-500 dark:text-blue-400';
  }
  if (teamTone === 'bravo') {
    return 'text-red-500 dark:text-red-400';
  }
  return 'text-foreground';
}

function getTeamHeaderAccentClass(teamTone: ScoreboardTeamTone): string {
  if (teamTone === 'alpha') {
    return 'border-t-2 border-t-blue-500/70';
  }
  if (teamTone === 'bravo') {
    return 'border-t-2 border-t-red-500/70';
  }
  return '';
}

function getStandingBadgeClass(standing?: string): string {
  if (standing === 'Victory') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  }
  if (standing === 'Defeat') {
    return 'border-destructive/40 bg-destructive/10 text-destructive';
  }
  return 'border-border bg-muted text-muted-foreground';
}

export function TeamRosterSection({
  label,
  teamTone,
  standing,
  score,
  playerCount,
  children,
}: TeamRosterSectionProps) {
  return (
    <section
      aria-label={`${label} roster`}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm',
        getTeamHeaderAccentClass(teamTone),
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b bg-muted/30 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <h4
            className={cn(
              'font-heading text-xl font-bold tracking-wide sm:text-2xl',
              getTeamLabelClass(teamTone),
            )}
          >
            {label}
          </h4>

          {standing && (
            <Badge
              variant="outline"
              className={cn(
                'px-2 py-0.5 text-[11px] font-semibold',
                getStandingBadgeClass(standing),
              )}
            >
              {standing}
            </Badge>
          )}

          <span className="text-xs font-medium text-muted-foreground">
            {playerCount} {playerCount === 1 ? 'player' : 'players'}
          </span>
        </div>

        {score !== undefined && score !== '' && (
          <span className="font-heading text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {score}
          </span>
        )}
      </header>

      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}
