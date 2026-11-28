import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { Aggregate, Session, SessionParticipant } from '~/api';
import {
  TEAMMATE_QUERY_PARAM,
  filterAggregatesByCompanions,
  parseSelectedTeammateIds,
  resolveSelectedCompanions,
  resolveSessionCompanions,
} from '~/lib/session-companions';

export interface UseSessionCompanionFilterOptions {
  session?: Session;
  aggregates?: Aggregate[];
  participants?: Record<string, SessionParticipant>;
  characterId: string;
}

export function useSessionCompanionFilter({
  session,
  aggregates,
  participants,
  characterId,
}: UseSessionCompanionFilterOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  const companions = useMemo(
    () =>
      resolveSessionCompanions(session, aggregates, participants, characterId),
    [session, aggregates, participants, characterId],
  );

  const selectedUserIds = useMemo(
    () => parseSelectedTeammateIds(searchParams, companions),
    [searchParams, companions],
  );

  const selectedCompanions = useMemo(
    () => resolveSelectedCompanions(searchParams, companions),
    [searchParams, companions],
  );

  const filteredAggregates = useMemo(() => {
    if (!aggregates || aggregates.length === 0) {
      return [];
    }
    return filterAggregatesByCompanions(
      aggregates,
      characterId,
      selectedCompanions,
      participants,
    );
  }, [aggregates, characterId, selectedCompanions, participants]);

  const toggleCompanion = useCallback(
    (userId: string) => {
      const nextParams = new URLSearchParams(searchParams);
      const nextSelected = selectedUserIds.includes(userId)
        ? selectedUserIds.filter((id) => id !== userId)
        : [...selectedUserIds, userId];

      nextParams.delete(TEAMMATE_QUERY_PARAM);
      for (const id of nextSelected) {
        nextParams.append(TEAMMATE_QUERY_PARAM, id);
      }

      setSearchParams(nextParams, {
        replace: true,
        preventScrollReset: true,
      });
    },
    [searchParams, selectedUserIds, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(TEAMMATE_QUERY_PARAM);
    setSearchParams(nextParams, {
      replace: true,
      preventScrollReset: true,
    });
  }, [searchParams, setSearchParams]);

  const teammateSearch = useMemo(() => {
    if (selectedUserIds.length === 0) {
      return '';
    }
    const params = new URLSearchParams();
    for (const id of selectedUserIds) {
      params.append(TEAMMATE_QUERY_PARAM, id);
    }
    return `?${params.toString()}`;
  }, [selectedUserIds]);

  return {
    companions,
    selectedUserIds,
    selectedCompanions,
    filteredAggregates,
    teammateSearch,
    toggleCompanion,
    clearFilters,
  };
}
