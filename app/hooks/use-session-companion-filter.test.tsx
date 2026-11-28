import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Aggregate, Session, SessionParticipant } from '~/api';

import { useSessionCompanionFilter } from './use-session-companion-filter';

function createWrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    );
  };
}

const mockSession = {
  id: 'sess-1',
  userId: 'user-owner',
  characterId: 'char-owner',
  summary: {
    totalMatches: 3,
    companions: [
      {
        userId: 'user-a',
        displayName: 'Alpha',
        sharedMatches: 2,
        wins: 2,
        losses: 0,
        sessions: [
          {
            sessionId: 'sess-a',
            characterId: 'char-a',
            sharedMatches: 2,
          },
        ],
      },
      {
        userId: 'user-b',
        displayName: 'Bravo',
        sharedMatches: 2,
        wins: 1,
        losses: 1,
        sessions: [
          {
            sessionId: 'sess-b',
            characterId: 'char-b',
            sharedMatches: 2,
          },
        ],
      },
    ],
  },
} as unknown as Session;

const mockParticipants: Record<string, SessionParticipant> = {
  'char-a': { userId: 'user-a', characterId: 'char-a', displayName: 'Alpha' },
  'char-b': { userId: 'user-b', characterId: 'char-b', displayName: 'Bravo' },
};

const makeAgg = (id: string, charIds: string[]): Aggregate => {
  const performance: Record<string, unknown> = {
    'char-owner': {
      playerStats: {
        fireTeamId: { value: 99, displayValue: '99' },
        team: { value: 18, displayValue: '18' },
        standing: { value: 0, displayValue: 'Victory' },
      },
    },
  };
  for (const cid of charIds) {
    performance[cid] = {
      playerStats: {
        fireTeamId: { value: 99, displayValue: '99' },
        team: { value: 18, displayValue: '18' },
        standing: { value: 0, displayValue: 'Victory' },
      },
    };
  }
  return {
    id,
    activityDetails: { instanceId: id, isPrivate: false },
    snapshotLinks: {},
    performance,
  } as unknown as Aggregate;
};

const mockAggregates = [
  makeAgg('m1', ['char-a']),
  makeAgg('m2', ['char-a', 'char-b']),
  makeAgg('m3', ['char-b']),
];

describe('useSessionCompanionFilter', () => {
  it('supports toggling single and multiple teammates with AND filtering and clearing', () => {
    const { result } = renderHook(
      () =>
        useSessionCompanionFilter({
          session: mockSession,
          aggregates: mockAggregates,
          participants: mockParticipants,
          characterId: 'char-owner',
        }),
      { wrapper: createWrapper(['/sessions/sess-1']) },
    );

    expect(result.current.companions).toHaveLength(2);
    expect(result.current.selectedUserIds).toEqual([]);
    expect(result.current.filteredAggregates).toHaveLength(3);
    expect(result.current.teammateSearch).toBe('');

    act(() => {
      result.current.toggleCompanion('user-a');
    });
    expect(result.current.selectedUserIds).toEqual(['user-a']);
    expect(result.current.filteredAggregates.map((a) => a.id)).toEqual([
      'm1',
      'm2',
    ]);
    expect(result.current.teammateSearch).toBe('?teammate=user-a');

    act(() => {
      result.current.toggleCompanion('user-b');
    });
    expect(result.current.selectedUserIds).toEqual(['user-a', 'user-b']);
    expect(result.current.filteredAggregates.map((a) => a.id)).toEqual(['m2']);
    expect(result.current.teammateSearch).toBe(
      '?teammate=user-a&teammate=user-b',
    );

    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.selectedUserIds).toEqual([]);
    expect(result.current.filteredAggregates).toHaveLength(3);
    expect(result.current.teammateSearch).toBe('');
  });

  it('ignores unknown teammate IDs from URL search params', () => {
    const { result } = renderHook(
      () =>
        useSessionCompanionFilter({
          session: mockSession,
          aggregates: mockAggregates,
          participants: mockParticipants,
          characterId: 'char-owner',
        }),
      {
        wrapper: createWrapper([
          '/sessions/sess-1?teammate=unknown&teammate=user-b',
        ]),
      },
    );

    expect(result.current.selectedUserIds).toEqual(['user-b']);
    expect(result.current.filteredAggregates.map((a) => a.id)).toEqual([
      'm2',
      'm3',
    ]);
  });
});
