import { useCallback, useMemo, useState } from 'react';

export interface DraftCharacterEntry {
  characterId: string;
  baseSavedCharId?: string;
}

export function updateDraftCharacters(
  prev: Record<string, DraftCharacterEntry>,
  memberKey: string,
  savedCharId: string | undefined,
  nextCharId?: string | null,
): Record<string, DraftCharacterEntry> {
  if (!nextCharId || nextCharId === savedCharId) {
    if (!(memberKey in prev)) return prev;
    const next = { ...prev };
    delete next[memberKey];
    return next;
  }

  return {
    ...prev,
    [memberKey]: {
      characterId: nextCharId,
      baseSavedCharId: savedCharId,
    },
  };
}

export function pruneStaleDraftCharacters(
  drafts: Record<string, DraftCharacterEntry>,
  savedCharacters: Record<string, string>,
): Record<string, string> {
  const active: Record<string, string> = {};
  for (const [memberKey, entry] of Object.entries(drafts)) {
    const currentSaved = savedCharacters[memberKey];
    if (
      currentSaved === entry.baseSavedCharId &&
      entry.characterId !== currentSaved
    ) {
      active[memberKey] = entry.characterId;
    }
  }
  return active;
}

export interface UseFireteamSelectionResult {
  draftCharacters: Record<string, string>;
  excludedMemberIds: Record<string, boolean>;
  toggleMemberBulkSelect: (memberKey: string, selected: boolean) => void;
  selectMemberCharacter: (
    memberKey: string,
    nextCharId?: string | null,
  ) => void;
}

export function useFireteamSelection(
  fireteamMemWithCharacters: Record<string, string>,
): UseFireteamSelectionResult {
  const [draftEntries, setDraftEntries] = useState<
    Record<string, DraftCharacterEntry>
  >({});
  const [excludedMemberIds, setExcludedMemberIds] = useState<
    Record<string, boolean>
  >({});

  const draftCharacters = useMemo(
    () => pruneStaleDraftCharacters(draftEntries, fireteamMemWithCharacters),
    [draftEntries, fireteamMemWithCharacters],
  );

  const toggleMemberBulkSelect = useCallback(
    (memberKey: string, selected: boolean) => {
      setExcludedMemberIds((prev) => ({
        ...prev,
        [memberKey]: !selected,
      }));
    },
    [],
  );

  const selectMemberCharacter = useCallback(
    (memberKey: string, nextCharId?: string | null) => {
      const savedCharId = fireteamMemWithCharacters[memberKey];
      setDraftEntries((prev) =>
        updateDraftCharacters(prev, memberKey, savedCharId, nextCharId),
      );
    },
    [fireteamMemWithCharacters],
  );

  return {
    draftCharacters,
    excludedMemberIds,
    toggleMemberBulkSelect,
    selectMemberCharacter,
  };
}
