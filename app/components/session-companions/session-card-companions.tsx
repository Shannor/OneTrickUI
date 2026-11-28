import { Users } from 'lucide-react';
import type { SessionCompanion } from '~/api';
import { WinLossRecord } from '~/components/win-loss-record';
import {
  formatSharedMatchCount,
  getCompanionPrimaryEmblem,
} from '~/lib/session-companions';
import { cn } from '~/lib/utils';

const MAX_VISIBLE_CARD_COMPANIONS = 5;
const MAX_VISIBLE_COMPACT_COMPANIONS = 3;

export interface SessionCardCompanionsProps {
  companions?: SessionCompanion[];
  totalMatches?: number;
  compact?: boolean;
  className?: string;
}

export function SessionCardCompanions({
  companions,
  totalMatches,
  compact = false,
  className,
}: SessionCardCompanionsProps) {
  if (!companions || companions.length === 0) {
    return null;
  }

  const maxVisible = compact
    ? MAX_VISIBLE_COMPACT_COMPANIONS
    : MAX_VISIBLE_CARD_COMPANIONS;
  const visibleCompanions = companions.slice(0, maxVisible);
  const overflowCount = companions.length - visibleCompanions.length;

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-1.5',
        !compact && 'border-t border-border/50 pt-3.5 md:gap-2',
        compact && 'pt-1',
        className,
      )}
    >
      <span
        className={cn(
          'flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground',
          compact ? 'text-xs' : 'text-xs lg:text-sm',
        )}
      >
        <Users
          className={cn(
            'shrink-0 text-primary',
            compact ? 'h-3 w-3' : 'h-3.5 w-3.5 lg:h-4 lg:w-4',
          )}
        />
        Fireteam
      </span>
      <div
        className={cn(
          'flex flex-wrap items-center',
          compact ? 'gap-1.5' : 'gap-2',
        )}
      >
        {visibleCompanions.map((companion) => (
          <SessionCardCompanionItem
            key={companion.userId}
            companion={companion}
            totalMatches={totalMatches}
            compact={compact}
          />
        ))}
        {overflowCount > 0 && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center rounded-full border border-border/60 bg-muted/40 font-semibold text-muted-foreground',
              compact
                ? 'px-2 py-0.5 text-xs'
                : 'px-2.5 py-1 text-xs md:text-sm',
            )}
          >
            +{overflowCount} more
          </span>
        )}
      </div>
    </div>
  );
}

function SessionCardCompanionItem({
  companion,
  totalMatches,
  compact,
}: {
  companion: SessionCompanion;
  totalMatches?: number;
  compact: boolean;
}) {
  const emblemUrl = getCompanionPrimaryEmblem(companion);
  const matchCountLabel = formatSharedMatchCount(
    companion.sharedMatches,
    totalMatches,
  );

  return (
    <div
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 text-foreground',
        compact
          ? 'px-2 py-0.5 text-xs'
          : 'px-2.5 py-1 text-xs md:px-3 md:text-sm',
      )}
    >
      {emblemUrl && (
        <img
          src={emblemUrl}
          alt={`${companion.displayName} emblem`}
          className={cn(
            'shrink-0 rounded-full object-cover',
            compact ? 'h-3.5 w-3.5' : 'h-4 w-4 md:h-5 md:w-5',
          )}
        />
      )}
      <span
        className={cn(
          'truncate font-semibold',
          compact ? 'max-w-[96px]' : 'max-w-[140px] sm:max-w-[180px]',
        )}
      >
        {companion.displayName}
      </span>
      <span className="shrink-0 tabular-nums text-muted-foreground">
        {matchCountLabel}
      </span>
      <WinLossRecord
        wins={companion.wins}
        losses={companion.losses}
        className="shrink-0"
      />
    </div>
  );
}
