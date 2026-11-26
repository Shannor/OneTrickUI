import { SquareLibrary } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TooltipProvider } from '~/components/ui/tooltip';
import type {
  MatchScoreboardViewModel,
  ScoreboardParticipantEntry,
} from '~/lib/match-scoreboard';
import { cn } from '~/lib/utils';

import { MatchPlayerRow } from './match-player-row';
import { ParticipantLoadoutSheet } from './participant-loadout-sheet';
import { TeamRosterSection } from './team-roster-section';

export interface MatchScoreboardProps {
  viewModel: MatchScoreboardViewModel;
}

export function MatchScoreboard({ viewModel }: MatchScoreboardProps) {
  const { mode, groups, counts } = viewModel;
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );

  const trackedEntries = useMemo<ScoreboardParticipantEntry[]>(() => {
    const entries: ScoreboardParticipantEntry[] = [];
    for (const group of groups) {
      for (const entry of group.entries) {
        if (entry.trackingKind !== 'none') {
          entries.push(entry);
        }
      }
    }
    return entries;
  }, [groups]);

  const selectedEntry = useMemo(
    () =>
      trackedEntries.find(
        (entry) => entry.participant.characterId === selectedCharacterId,
      ) ?? null,
    [trackedEntries, selectedCharacterId],
  );

  const gridClass =
    mode === 'teams'
      ? 'grid grid-cols-1 items-start gap-4 lg:grid-cols-2 xl:gap-6'
      : 'grid grid-cols-1 gap-4';

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Match Scoreboard
            </h3>
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {counts.participantCount}{' '}
              {counts.participantCount === 1 ? 'Guardian' : 'Guardians'}
            </span>
          </div>

          {counts.trackedPlayerCount > 0 && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <SquareLibrary className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                {counts.trackedPlayerCount}{' '}
                {counts.trackedPlayerCount === 1 ? 'player' : 'players'} tracked
                on 1 Trick — select a highlighted Guardian to inspect build and
                session details.
              </span>
            </p>
          )}
        </div>

        <div className={cn(gridClass)}>
          {groups.map((group) => (
            <TeamRosterSection
              key={group.id}
              label={group.label}
              teamTone={group.teamTone}
              standing={group.standing}
              score={group.score}
              playerCount={group.entries.length}
            >
              {group.entries.map((entry) => {
                const isTracked = entry.trackingKind !== 'none';
                const characterId = entry.participant.characterId;

                return (
                  <MatchPlayerRow
                    key={characterId}
                    entry={entry}
                    isSelected={selectedCharacterId === characterId}
                    onInspect={
                      isTracked
                        ? () => setSelectedCharacterId(characterId)
                        : undefined
                    }
                  />
                );
              })}
            </TeamRosterSection>
          ))}
        </div>

        <ParticipantLoadoutSheet
          selectedEntry={selectedEntry}
          trackedEntries={trackedEntries}
          onSelectCharacter={setSelectedCharacterId}
          onClose={() => setSelectedCharacterId(null)}
        />
      </div>
    </TooltipProvider>
  );
}
