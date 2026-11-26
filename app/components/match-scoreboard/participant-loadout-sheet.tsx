import { Hourglass, Info, SquareLibrary } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import type { CharacterSnapshot, WeaponInstanceMetrics } from '~/api';
import { ClassStats } from '~/charts/ClassStats';
import {
  Abilities,
  Aspects,
  Fragments,
  SubClassHeader,
} from '~/components/sub-class';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { Weapon } from '~/components/weapon';
import { WeaponKills } from '~/components/weapon-kills';
import { useIsMobile } from '~/hooks/use-mobile';
import {
  type ScoreboardParticipantEntry,
  getWeaponDisplayName,
} from '~/lib/match-scoreboard';
import { cn, getItemIconUrl, setBungieUrl } from '~/lib/utils';
import { SubClassProvider } from '~/providers/sub-class-provider';

export interface ParticipantLoadoutSheetProps {
  selectedEntry: ScoreboardParticipantEntry | null;
  trackedEntries: ScoreboardParticipantEntry[];
  onSelectCharacter: (characterId: string) => void;
  onClose: () => void;
}

interface TrackedPlayerSwitcherProps {
  trackedEntries: ScoreboardParticipantEntry[];
  selectedCharacterId: string;
  onSelectCharacter: (characterId: string) => void;
}

function TrackedPlayerSwitcher({
  trackedEntries,
  selectedCharacterId,
  onSelectCharacter,
}: TrackedPlayerSwitcherProps) {
  if (trackedEntries.length <= 1) {
    return null;
  }

  return (
    <div
      role="tablist"
      aria-label="Tracked players in this match"
      className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-2"
    >
      {trackedEntries.map((item) => {
        const isActive = item.participant.characterId === selectedCharacterId;
        const emblemSrc = setBungieUrl(item.participant.emblemIconUrl);
        const initial = item.participant.displayName.charAt(0).toUpperCase();

        return (
          <button
            key={item.participant.characterId}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCharacter(item.participant.characterId)}
            className={cn(
              'inline-flex min-h-8 shrink-0 touch-manipulation items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Avatar className="h-4 w-4 shrink-0 rounded-sm">
              <AvatarImage src={emblemSrc} alt="" />
              <AvatarFallback className="rounded-sm text-[9px] font-bold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[10rem] truncate">
              {item.participant.displayName}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface SheetActionsFooterProps {
  userId?: string;
  characterId: string;
  sessionId?: string;
  snapshotId?: string;
  hasSnapshot: boolean;
}

function SheetActionsFooter({
  userId,
  characterId,
  sessionId,
  snapshotId,
  hasSnapshot,
}: SheetActionsFooterProps) {
  const showSessionLink = Boolean(userId && sessionId);
  const showLoadoutLink = Boolean(userId && snapshotId && hasSnapshot);

  if (!showSessionLink && !showLoadoutLink) {
    return null;
  }

  return (
    <div className="shrink-0 border-t bg-background/95 px-4 py-3 sm:px-6 sm:py-4">
      <div className="grid grid-cols-2 gap-2">
        {showSessionLink && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn(
              'min-h-10 w-full touch-manipulation justify-center text-xs font-semibold',
              !showLoadoutLink && 'col-span-2',
            )}
          >
            <Link
              to={`/profile/${userId}/c/${characterId}/sessions/${sessionId}`}
            >
              <Hourglass className="mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">View Session</span>
            </Link>
          </Button>
        )}
        {showLoadoutLink && (
          <Button
            asChild
            variant="default"
            size="sm"
            className={cn(
              'min-h-10 w-full touch-manipulation justify-center text-xs font-semibold',
              !showSessionLink && 'col-span-2',
            )}
          >
            <Link
              to={`/profile/${userId}/c/${characterId}/loadouts/${snapshotId}`}
            >
              <SquareLibrary className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span className="truncate">View Loadout</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

interface LoadoutSnapshotBodyProps {
  snapshot: CharacterSnapshot;
  weapons: WeaponInstanceMetrics[];
}

function LoadoutSnapshotBody({ snapshot, weapons }: LoadoutSnapshotBodyProps) {
  const [showClassDetails, setShowClassDetails] = useState(false);

  const statValues = Object.values(snapshot.stats ?? {})
    .filter((stat) => stat.name !== 'Power')
    .map((stat) => ({
      stat: stat.name,
      value: stat.value,
    }));

  return (
    <div className="flex flex-col gap-5">
      <SubClassProvider snapshot={snapshot}>
        <SubClassHeader
          showMore={showClassDetails}
          onToggleShowMore={() => setShowClassDetails((prev) => !prev)}
        />
        {showClassDetails && (
          <div className="mt-3 flex flex-col gap-4 border-t border-border/60 pt-3">
            <Abilities />
            <Aspects />
            <Fragments />
          </div>
        )}
      </SubClassProvider>

      {statValues.length > 0 && (
        <div className="border-t border-border/60 pt-4">
          <ClassStats data={statValues} />
        </div>
      )}

      {weapons.length > 0 && (
        <div className="flex flex-col gap-5 border-t border-border/60 pt-4">
          {weapons.map((weapon, index) => (
            <Weapon
              key={
                weapon.referenceId
                  ? String(weapon.referenceId)
                  : `${getWeaponDisplayName(weapon)}-${index}`
              }
              {...weapon}
              showTitle={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SessionOnlyWeaponBodyProps {
  weapons: WeaponInstanceMetrics[];
}

function SessionOnlyWeaponBody({ weapons }: SessionOnlyWeaponBodyProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          No loadout snapshot was matched for this activity. Showing post-game
          weapon metrics from this tracked session.
        </span>
      </div>

      {weapons.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No weapon kills were recorded in this match.
        </p>
      ) : (
        <div className="divide-y divide-border/60 rounded-lg border border-border/70 bg-background/60">
          {weapons.map((weapon, index) => {
            const name = getWeaponDisplayName(weapon);
            const iconUrl = getItemIconUrl(
              weapon.properties,
              weapon.display?.icon,
            );
            const archetype =
              weapon.properties?.baseInfo?.itemTypeDisplayName ??
              weapon.itemTypeDisplayName;
            const key = weapon.referenceId
              ? String(weapon.referenceId)
              : `${name}-${index}`;

            return (
              <div
                key={key}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar className="h-9 w-9 shrink-0 rounded-md border bg-black/40 p-0.5">
                    <AvatarImage src={iconUrl} alt={name} />
                    <AvatarFallback className="rounded-md text-xs font-bold">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {name}
                    </span>
                    {archetype && (
                      <span className="text-xs text-muted-foreground">
                        {archetype}
                      </span>
                    )}
                  </div>
                </div>
                {weapon.stats && <WeaponKills stats={weapon.stats} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatClassSummary(
  subclassName: string | undefined,
  characterClass: string,
): string {
  if (!subclassName) {
    return characterClass;
  }
  if (subclassName.toLowerCase().includes(characterClass.toLowerCase())) {
    return subclassName;
  }
  return `${subclassName} ${characterClass}`;
}

export function ParticipantLoadoutSheet({
  selectedEntry,
  trackedEntries,
  onSelectCharacter,
  onClose,
}: ParticipantLoadoutSheetProps) {
  const isMobile = useIsMobile();
  const isOpen = selectedEntry !== null;

  const sheetSide = isMobile ? 'bottom' : 'right';
  const sheetContentClass = isMobile
    ? 'flex max-h-[88dvh] w-full flex-col gap-0 rounded-t-2xl p-0'
    : 'flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg lg:max-w-xl';

  if (!selectedEntry) {
    return (
      <Sheet open={false} onOpenChange={() => undefined}>
        <SheetContent side={sheetSide} className={sheetContentClass} />
      </Sheet>
    );
  }

  const { participant, snapshot, subclass, trackingKind, stats, weapons } =
    selectedEntry;
  const targetUserId = participant.userId || snapshot?.userId;
  const emblemSrc = setBungieUrl(participant.emblemIconUrl);
  const initial = participant.displayName.charAt(0).toUpperCase() || '?';
  const classSummary = formatClassSummary(
    subclass?.name,
    participant.characterClass,
  );
  const statsSummary = `${stats.kills}/${stats.deaths}/${stats.assists} · ${stats.kd} K/D`;
  const descriptionLine = participant.lightLevel
    ? `${classSummary} · ${participant.lightLevel} · ${statsSummary}`
    : `${classSummary} · ${statsSummary}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={sheetSide} className={sheetContentClass}>
        <SheetHeader className="shrink-0 space-y-0 border-b px-4 pb-3 pt-3 text-left sm:px-6 sm:pb-4 sm:pt-5">
          {isMobile && (
            <div
              aria-hidden="true"
              className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-muted-foreground/30"
            />
          )}

          <div className="flex items-center gap-3 pr-8">
            <Avatar className="h-10 w-10 shrink-0 rounded-md border border-border/70 bg-muted/40">
              <AvatarImage
                src={emblemSrc}
                alt={`${participant.displayName} emblem`}
              />
              <AvatarFallback className="rounded-md text-xs font-bold">
                {initial}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <SheetTitle className="flex flex-wrap items-baseline gap-x-1.5 text-base font-bold leading-tight sm:text-lg">
                <span className="truncate">{participant.displayName}</span>
                {participant.displayNameCode && (
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    #{participant.displayNameCode}
                  </span>
                )}
              </SheetTitle>
              <SheetDescription className="mt-0.5 truncate text-xs text-muted-foreground">
                {descriptionLine}
              </SheetDescription>
            </div>
          </div>

          <TrackedPlayerSwitcher
            trackedEntries={trackedEntries}
            selectedCharacterId={participant.characterId}
            onSelectCharacter={onSelectCharacter}
          />
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {trackingKind === 'loadout' && snapshot ? (
            <LoadoutSnapshotBody
              key={participant.characterId}
              snapshot={snapshot}
              weapons={weapons}
            />
          ) : (
            <SessionOnlyWeaponBody
              key={participant.characterId}
              weapons={weapons}
            />
          )}
        </div>

        <SheetActionsFooter
          userId={targetUserId}
          characterId={participant.characterId}
          sessionId={participant.sessionId}
          snapshotId={participant.snapshotId}
          hasSnapshot={Boolean(snapshot)}
        />
      </SheetContent>
    </Sheet>
  );
}
