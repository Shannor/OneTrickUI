import { ChevronRight, Hourglass, SquareLibrary } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import type {
  ParticipantItemPreview,
  ParticipantStatsSummary,
  ParticipantTrackingKind,
  ScoreboardParticipantEntry,
} from '~/lib/match-scoreboard';
import { cn, setBungieUrl } from '~/lib/utils';

import { ParticipantWeaponStrip } from './participant-weapon-strip';

export interface MatchPlayerRowProps {
  entry: ScoreboardParticipantEntry;
  isSelected?: boolean;
  onInspect?: () => void;
}

const FIRETEAM_BAR_COLORS = [
  'bg-sky-500 dark:bg-sky-400',
  'bg-violet-500 dark:bg-violet-400',
  'bg-emerald-500 dark:bg-emerald-400',
  'bg-rose-500 dark:bg-rose-400',
];

function getFireteamBarColor(groupIndex: number): string {
  const safeIndex = Math.max(0, groupIndex - 1) % FIRETEAM_BAR_COLORS.length;
  return FIRETEAM_BAR_COLORS[safeIndex];
}

function getInspectAriaLabel(
  trackingKind: ParticipantTrackingKind,
  displayName: string,
): string {
  if (trackingKind === 'loadout') {
    return `Inspect build for ${displayName}`;
  }
  return `Inspect session details for ${displayName}`;
}

function getRowSurfaceClass(isTracked: boolean, isSelected: boolean): string {
  if (isSelected) {
    return 'cursor-pointer bg-primary/[0.12] hover:bg-primary/[0.15]';
  }
  if (isTracked) {
    return 'cursor-pointer bg-primary/[0.06] hover:bg-primary/[0.10]';
  }
  return 'hover:bg-muted/30';
}

interface FireteamEdgeBarProps {
  groupIndex?: number;
  stackSize?: number;
}

function FireteamEdgeBar({ groupIndex, stackSize }: FireteamEdgeBarProps) {
  if (!groupIndex || !stackSize) {
    return null;
  }

  return (
    <span
      data-testid={`fireteam-bar-${groupIndex}`}
      aria-label={`Fireteam ${groupIndex} (${stackSize} players)`}
      title={`Pre-made fireteam (${stackSize} players)`}
      className={cn(
        'absolute inset-y-0 left-0 w-1',
        getFireteamBarColor(groupIndex),
      )}
    />
  );
}

interface ParticipantStatCellsProps {
  stats: ParticipantStatsSummary;
}

function ParticipantStatCells({ stats }: ParticipantStatCellsProps) {
  const items = [
    { key: 'kills', label: 'K', title: 'Kills', value: String(stats.kills) },
    {
      key: 'deaths',
      label: 'D',
      title: 'Deaths',
      value: String(stats.deaths),
    },
    {
      key: 'assists',
      label: 'A',
      title: 'Assists',
      value: String(stats.assists),
    },
    { key: 'kd', label: 'K/D', title: 'Kill/Death Ratio', value: stats.kd },
    {
      key: 'eff',
      label: 'EFF',
      title: 'Efficiency',
      value: stats.efficiency,
    },
  ];

  return (
    <dl className="grid grid-cols-5 divide-x divide-border/50 rounded-md bg-muted/25 py-1 text-center sm:gap-2 sm:divide-x-0 sm:bg-transparent sm:py-0">
      {items.map((item) => (
        <div
          key={item.key}
          title={item.title}
          className="flex flex-col items-center px-1 sm:min-w-[2.6rem] sm:px-1"
        >
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {item.label}
          </dt>
          <dd className="text-xs font-bold tabular-nums text-foreground sm:text-sm">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface ParticipantSublineProps {
  entry: ScoreboardParticipantEntry;
}

function ParticipantSubline({ entry }: ParticipantSublineProps) {
  const { participant, subclass, trackingKind } = entry;
  const lightSuffix = participant.lightLevel
    ? ` · ${participant.lightLevel}`
    : '';

  if (trackingKind === 'loadout' && subclass) {
    const subclassIconSrc = subclass.icon ? setBungieUrl(subclass.icon) : '';
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
        {subclassIconSrc && (
          <img
            src={subclassIconSrc}
            alt={`${subclass.name} subclass`}
            className="h-4 w-4 shrink-0 rounded-sm bg-black/60 object-contain p-0.5"
          />
        )}
        <span className="truncate text-foreground/90">
          {subclass.name}
          {lightSuffix}
        </span>
      </div>
    );
  }

  if (trackingKind === 'session') {
    return (
      <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
        <Hourglass
          aria-hidden="true"
          className="h-3 w-3 shrink-0 text-amber-500"
        />
        <span>
          {participant.characterClass}
          {lightSuffix}
        </span>
      </div>
    );
  }

  return (
    <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
      {participant.characterClass}
      {lightSuffix}
    </span>
  );
}

interface TrackedTriggerIconProps {
  isLoadout: boolean;
  exoticArmor?: ParticipantItemPreview;
}

function TrackedTriggerIcon({
  isLoadout,
  exoticArmor,
}: TrackedTriggerIconProps) {
  const exoticIconSrc =
    isLoadout && exoticArmor?.icon ? setBungieUrl(exoticArmor.icon) : '';

  if (exoticIconSrc) {
    return (
      <img
        src={exoticIconSrc}
        alt={exoticArmor?.name ?? 'Exotic armor'}
        title={exoticArmor?.name}
        className="h-5 w-5 shrink-0 rounded-sm border border-amber-400/70 object-cover"
      />
    );
  }

  if (isLoadout) {
    return (
      <SquareLibrary aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
    );
  }

  return (
    <Hourglass
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0 text-amber-500"
    />
  );
}

interface TrackedLoadoutGhostTriggerProps {
  trackingKind: ParticipantTrackingKind;
  exoticArmor?: ParticipantItemPreview;
  ariaLabel: string;
  onInspect: () => void;
}

function TrackedLoadoutGhostTrigger({
  trackingKind,
  exoticArmor,
  ariaLabel,
  onInspect,
}: TrackedLoadoutGhostTriggerProps) {
  const isLoadout = trackingKind === 'loadout';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onInspect}
      aria-label={ariaLabel}
      className="ml-auto h-8 shrink-0 touch-manipulation gap-1.5 px-2 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary"
    >
      <TrackedTriggerIcon isLoadout={isLoadout} exoticArmor={exoticArmor} />
      <span>{isLoadout ? 'Loadout' : 'Session'}</span>
      <ChevronRight
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
      />
    </Button>
  );
}

interface ParticipantIdentityProps {
  entry: ScoreboardParticipantEntry;
}

function ParticipantIdentity({ entry }: ParticipantIdentityProps) {
  const { participant, trackingKind } = entry;
  const isTracked = trackingKind !== 'none';
  const emblemSrc = setBungieUrl(participant.emblemIconUrl);
  const initial = participant.displayName.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:items-start sm:gap-3">
      <Avatar
        className={cn(
          'h-9 w-9 shrink-0 rounded-md border bg-muted/40 sm:h-10 sm:w-10',
          isTracked
            ? 'border-primary/70 ring-1 ring-primary/35'
            : 'border-border/70',
        )}
      >
        <AvatarImage
          src={emblemSrc}
          alt={`${participant.displayName} emblem`}
        />
        <AvatarFallback className="rounded-md text-xs font-bold">
          {initial}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {participant.userId ? (
            <Link
              to={`/profile/${participant.userId}`}
              viewTransition
              className="truncate text-sm font-bold tracking-tight text-foreground transition-colors hover:text-primary sm:text-base"
            >
              {participant.displayName}
            </Link>
          ) : (
            <span className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
              {participant.displayName}
            </span>
          )}

          {participant.displayNameCode && (
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground sm:text-xs">
              #{participant.displayNameCode}
            </span>
          )}

          {!participant.completed && (
            <Badge
              variant="outline"
              title="Left match early"
              className="border-border/80 bg-muted/60 px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
            >
              Left
            </Badge>
          )}
        </div>

        <ParticipantSubline entry={entry} />
      </div>
    </div>
  );
}

export function MatchPlayerRow({
  entry,
  isSelected = false,
  onInspect,
}: MatchPlayerRowProps) {
  const {
    trackingKind,
    stats,
    weapons,
    participant,
    exoticArmor,
    fireteamGroupIndex,
    fireteamStackSize,
  } = entry;
  const isTracked = trackingKind !== 'none';
  const didLeaveEarly = !participant.completed;
  const showInspectTrigger = Boolean(isTracked && onInspect);
  const inspectAriaLabel = getInspectAriaLabel(
    trackingKind,
    participant.displayName,
  );

  function handleRowClick(event: MouseEvent<HTMLDivElement>) {
    if (!isTracked || !onInspect) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('a, button')) {
      return;
    }
    onInspect();
  }

  return (
    <div
      data-left-early={didLeaveEarly ? 'true' : undefined}
      onClick={handleRowClick}
      className={cn(
        'group relative flex flex-col gap-2 py-2.5 pl-3.5 pr-3 transition-colors sm:py-3 sm:pl-4 sm:pr-4',
        getRowSurfaceClass(isTracked, isSelected),
        didLeaveEarly && 'opacity-50 saturate-50',
      )}
    >
      <FireteamEdgeBar
        groupIndex={fireteamGroupIndex}
        stackSize={fireteamStackSize}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ParticipantIdentity entry={entry} />
        <div className="shrink-0">
          <ParticipantStatCells stats={stats} />
        </div>
      </div>

      {(weapons.length > 0 || showInspectTrigger) && (
        <div className="flex flex-wrap items-center justify-between gap-2 sm:pl-12">
          {weapons.length > 0 && <ParticipantWeaponStrip weapons={weapons} />}

          {showInspectTrigger && onInspect && (
            <TrackedLoadoutGhostTrigger
              trackingKind={trackingKind}
              exoticArmor={exoticArmor}
              ariaLabel={inspectAriaLabel}
              onInspect={onInspect}
            />
          )}
        </div>
      )}
    </div>
  );
}
