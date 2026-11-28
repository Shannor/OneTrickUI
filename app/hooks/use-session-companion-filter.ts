import { useCallback, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router';
import type {
  Aggregate,
  Session,
  SessionCompanion,
  SessionParticipant,
} from '~/api';
import {
  TEAMMATE_QUERY_PARAM,
  filterAggregatesByCompanions,
  parseSelectedTeammateIds,
  resolveSessionCompanions,
} from '~/lib/session-companions';

export interface UseSessionCompanionFilterOptions {
  session?: Session;
  aggregates?: Aggregate[];
  participants?: Record<string, SessionParticipant>;
  characterId: string;
  enabled?: boolean;
}

export interface SessionCompanionFilterState {
  companions: SessionCompanion[];
  selectedUserIds: string[];
  selectedCompanions: SessionCompanion[];
  filteredAggregates: Aggregate[];
  teammateSearch: string;
  toggleCompanion: (userId: string) => void;
  clearFilters: () => void;
}

export function useSessionCompanionFilter({
  session,
  aggregates,
  participants,
  characterId,
  enabled = true,
}: UseSessionCompanionFilterOptions): SessionCompanionFilterState {
  const [searchParams, setSearchParams] = useSearchParams();

  const companions = useMemo(
    () =>
      enabled
        ? resolveSessionCompanions(
            session,
            aggregates,
            participants,
            characterId,
          )
        : [],
    [enabled, session, aggregates, participants, characterId],
  );

  const selectedUserIds = useMemo(
    () => (enabled ? parseSelectedTeammateIds(searchParams, companions) : []),
    [enabled, searchParams, companions],
  );

  const selectedCompanions = useMemo(() => {
    if (!enabled || selectedUserIds.length === 0) {
      return [];
    }
    const byUserId = new Map(companions.map((c) => [c.userId, c]));
    return selectedUserIds
      .map((userId) => byUserId.get(userId))
      .filter((c): c is SessionCompanion => Boolean(c));
  }, [enabled, selectedUserIds, companions]);

  const filteredAggregates = useMemo(() => {
    if (!enabled || !aggregates || aggregates.length === 0) {
      return [];
    }
    return filterAggregatesByCompanions(
      aggregates,
      characterId,
      selectedCompanions,
      participants,
    );
  }, [enabled, aggregates, characterId, selectedCompanions, participants]);

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
    if (!enabled || selectedUserIds.length === 0) {
      return '';
    }
    const params = new URLSearchParams();
    for (const id of selectedUserIds) {
      params.append(TEAMMATE_QUERY_PARAM, id);
    }
    return `?${params.toString()}`;
  }, [enabled, selectedUserIds]);

  return useMemo(
    () => ({
      companions,
      selectedUserIds,
      selectedCompanions,
      filteredAggregates,
      teammateSearch,
      toggleCompanion,
      clearFilters,
    }),
    [
      companions,
      selectedUserIds,
      selectedCompanions,
      filteredAggregates,
      teammateSearch,
      toggleCompanion,
      clearFilters,
    ],
  );
}

export function useSessionOutletCompanionFilter(
  options: Omit<UseSessionCompanionFilterOptions, 'enabled'>,
): SessionCompanionFilterState {
  const outletContext = useOutletContext<SessionCompanionFilterState | null>();
  const fallback = useSessionCompanionFilter({
    ...options,
    enabled: !outletContext,
  });
  return outletContext ?? fallback;
}
