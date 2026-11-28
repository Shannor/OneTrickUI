import { ChevronDown, ExternalLink, Filter, Users, X } from 'lucide-react';
import { Link } from 'react-router';
import type { CompanionInstance, SessionCompanion } from '~/api';
import { Button } from '~/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { WinLossRecord } from '~/components/win-loss-record';
import {
  formatSelectedCompanionNames,
  formatSharedMatchCount,
  getCompanionPrimaryEmblem,
  getCompanionSessionPath,
} from '~/lib/session-companions';
import { cn, setBungieUrl } from '~/lib/utils';

export interface SessionCompanionsBarProps {
  companions: SessionCompanion[];
  totalMatches?: number;
  filteredCount?: number;
  selectedUserIds: string[];
  onToggleCompanion: (userId: string) => void;
  onClearFilters: () => void;
  className?: string;
}

export function SessionCompanionsBar({
  companions,
  totalMatches,
  filteredCount,
  selectedUserIds,
  onToggleCompanion,
  onClearFilters,
  className,
}: SessionCompanionsBarProps) {
  if (companions.length === 0) {
    return null;
  }

  const selectedSet = new Set(selectedUserIds);
  const selectedCompanions = companions.filter((c) =>
    selectedSet.has(c.userId),
  );
  const hasActiveFilter = selectedCompanions.length > 0;
  const helperHint =
    companions.length > 1
      ? 'Select teammates to filter (all selected must be present)'
      : 'Select a teammate to filter';

  return (
    <TooltipProvider>
      <section
        aria-label="Fireteam companions"
        className={cn('flex w-full flex-col gap-2.5', className)}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
            <Users className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
            <span>Fireteam</span>
            <span className="hidden font-normal normal-case tracking-normal text-muted-foreground/80 sm:inline">
              — {helperHint}
            </span>
          </div>
          {hasActiveFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear filter</span>
            </Button>
          )}
          <span className="w-full text-xs text-muted-foreground/80 sm:hidden">
            {helperHint}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {companions.map((companion) => (
            <SessionCompanionPill
              key={companion.userId}
              companion={companion}
              totalMatches={totalMatches}
              isSelected={selectedSet.has(companion.userId)}
              onToggle={() => onToggleCompanion(companion.userId)}
            />
          ))}
        </div>

        {hasActiveFilter &&
          filteredCount !== undefined &&
          totalMatches !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
              <Filter className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                Showing{' '}
                <span className="font-semibold text-foreground">
                  {filteredCount} of {totalMatches}
                </span>{' '}
                {totalMatches === 1 ? 'match' : 'matches'} with{' '}
                <span className="font-semibold text-foreground">
                  {formatSelectedCompanionNames(selectedCompanions)}
                </span>
              </span>
            </div>
          )}
      </section>
    </TooltipProvider>
  );
}

function SessionCompanionPill({
  companion,
  totalMatches,
  isSelected,
  onToggle,
}: {
  companion: SessionCompanion;
  totalMatches?: number;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const emblemUrl = getCompanionPrimaryEmblem(companion);
  const matchCountLabel = formatSharedMatchCount(
    companion.sharedMatches,
    totalMatches,
  );
  const linkedSessions = (companion.sessions ?? []).filter((instance) =>
    Boolean(instance.sessionId && instance.characterId),
  );

  return (
    <div
      className={cn(
        'flex w-full max-w-full items-stretch overflow-hidden rounded-lg border text-xs transition-colors sm:inline-flex sm:w-auto sm:text-sm',
        isSelected
          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40'
          : 'border-border/70 bg-muted/30 text-foreground hover:border-border',
      )}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onToggle}
        className={cn(
          'flex min-h-11 min-w-0 flex-1 cursor-pointer touch-manipulation items-center gap-2.5 px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:min-h-9 sm:flex-initial sm:gap-2 sm:py-1.5',
          isSelected ? 'hover:bg-primary/15' : 'hover:bg-muted/60',
        )}
      >
        {emblemUrl && (
          <img
            src={emblemUrl}
            alt={`${companion.displayName} emblem`}
            className="h-6 w-6 shrink-0 rounded-sm object-cover sm:h-5 sm:w-5"
          />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-initial sm:flex-row sm:items-center sm:gap-2">
          <span className="truncate text-sm font-semibold sm:max-w-[180px]">
            {companion.displayName}
          </span>
          <span className="flex items-center gap-1.5 text-xs tabular-nums sm:text-sm">
            <span className="shrink-0 text-muted-foreground">
              {matchCountLabel}
            </span>
            <WinLossRecord
              wins={companion.wins}
              losses={companion.losses}
              className="shrink-0"
            />
          </span>
        </span>
      </button>

      {linkedSessions.length === 1 && (
        <SingleSessionLink
          userId={companion.userId}
          displayName={companion.displayName}
          instance={linkedSessions[0]}
          isSelected={isSelected}
        />
      )}

      {linkedSessions.length > 1 && (
        <MultiSessionMenu
          userId={companion.userId}
          displayName={companion.displayName}
          sessions={linkedSessions}
          isSelected={isSelected}
        />
      )}
    </div>
  );
}

function SingleSessionLink({
  userId,
  displayName,
  instance,
  isSelected,
}: {
  userId: string;
  displayName: string;
  instance: CompanionInstance;
  isSelected: boolean;
}) {
  const sessionPath = getCompanionSessionPath(userId, instance);
  const classSuffix = instance.class ? ` (${instance.class})` : '';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={sessionPath}
          aria-label={`View ${displayName}'s session${classSuffix}`}
          className={cn(
            'inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center border-l px-2.5 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:min-h-9 sm:min-w-9',
            isSelected
              ? 'border-primary/40 hover:bg-primary/15'
              : 'border-border/60 hover:bg-muted/70',
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          View {displayName}&apos;s session{classSuffix}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function MultiSessionMenu({
  userId,
  displayName,
  sessions,
  isSelected,
}: {
  userId: string;
  displayName: string;
  sessions: CompanionInstance[];
  isSelected: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`View ${displayName}'s ${sessions.length} sessions`}
          className={cn(
            'inline-flex min-h-11 shrink-0 cursor-pointer touch-manipulation items-center gap-1 border-l px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:min-h-9',
            isSelected
              ? 'border-primary/40 hover:bg-primary/15'
              : 'border-border/60 hover:bg-muted/70',
          )}
        >
          <span>{sessions.length} sessions</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="mb-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground">
          {displayName}&apos;s sessions
        </div>
        <div className="flex flex-col gap-1">
          {sessions.map((instance) => {
            const emblemUrl = setBungieUrl(instance.emblemUrl);
            const path = getCompanionSessionPath(userId, instance);
            return (
              <Link
                key={instance.sessionId}
                to={path}
                className="flex min-h-10 touch-manipulation items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-9"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {emblemUrl && (
                    <img
                      src={emblemUrl}
                      alt={`${instance.class ?? displayName} emblem`}
                      className="h-5 w-5 shrink-0 rounded-sm object-cover"
                    />
                  )}
                  <span className="truncate font-semibold">
                    {instance.class || 'Guardian'}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                  <span>{formatSharedMatchCount(instance.sharedMatches)}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
