import { describe, expect, it } from 'vitest';
import type { FireteamMember } from '~/api';

import {
  type BulkFireteamSessionResult,
  findMemberBulkOutcome,
  formatBulkStartSummary,
  getMemberActiveSessions,
  resolveMemberDefaultCharacterId,
} from './fireteam-sessions';

const baseMember: FireteamMember = {
  id: 'user-1',
  membershipId: 'mem-1',
  displayName: 'HunterGuardian',
  characters: [
    {
      id: 'char-hunter',
      class: 'Hunter',
      race: 'Awoken',
      light: BigInt(2020),
      emblemURL: '/emblem-h.png',
      emblemBackgroundURL: '/bg-h.png',
      currentTitle: 'Flawless',
      emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
    },
    {
      id: 'char-warlock',
      class: 'Warlock',
      race: 'Human',
      light: BigInt(2015),
      emblemURL: '/emblem-w.png',
      emblemBackgroundURL: '/bg-w.png',
      currentTitle: 'Glorious',
      emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
    },
  ],
};

describe('resolveMemberDefaultCharacterId', () => {
  it('prefers saved preference when valid', () => {
    expect(
      resolveMemberDefaultCharacterId(baseMember, { 'user-1': 'char-warlock' }),
    ).toBe('char-warlock');
  });

  it('prefers active session character when no preference is saved', () => {
    const memberWithActive: FireteamMember = {
      ...baseMember,
      activeSessions: [
        {
          sessionId: 'sess-w',
          characterId: 'char-warlock',
          startedAt: new Date('2026-11-25T00:00:00Z'),
        },
      ],
    };

    expect(resolveMemberDefaultCharacterId(memberWithActive)).toBe(
      'char-warlock',
    );
  });

  it('falls back to first character when neither preference nor active session exists', () => {
    expect(resolveMemberDefaultCharacterId(baseMember)).toBe('char-hunter');
  });

  it('ignores stale preference that no longer matches member characters', () => {
    expect(
      resolveMemberDefaultCharacterId(baseMember, { 'user-1': 'char-deleted' }),
    ).toBe('char-hunter');
  });
});

describe('getMemberActiveSessions', () => {
  it('maps FireteamMember.activeSessions into pending MemberSessionData', () => {
    const startedAt = new Date('2026-11-25T00:00:00Z');
    const member: FireteamMember = {
      ...baseMember,
      activeSessions: [
        {
          sessionId: 'sess-active-1',
          characterId: 'char-hunter',
          startedAt,
          trackComp: true,
        },
      ],
    };

    const active = getMemberActiveSessions(member);
    expect(active).toEqual([
      {
        id: 'sess-active-1',
        userId: 'user-1',
        characterId: 'char-hunter',
        status: 'pending',
        startedAt,
        trackComp: true,
      },
    ]);
  });

  it('merges bulk start results for both started and skipped_active outcomes', () => {
    const bulkResults: BulkFireteamSessionResult[] = [
      {
        userId: 'user-1',
        characterId: 'char-warlock',
        outcome: 'started',
        session: {
          id: 'sess-new-2',
          userId: 'user-1',
          characterId: 'char-warlock',
          startedAt: '2026-11-25T00:10:00.000Z',
          status: 'pending',
          name: 'Comp Grind',
          aggregateIds: [],
          compTracking: { enabled: true },
        },
      },
    ];

    const member: FireteamMember = {
      ...baseMember,
      activeSessions: [
        {
          sessionId: 'sess-active-1',
          characterId: 'char-hunter',
          startedAt: new Date('2026-11-25T00:00:00Z'),
        },
      ],
    };

    const merged = getMemberActiveSessions(member, bulkResults);
    expect(merged).toHaveLength(2);
    expect(merged.find((s) => s.characterId === 'char-hunter')?.id).toBe(
      'sess-active-1',
    );
    expect(merged.find((s) => s.characterId === 'char-warlock')).toMatchObject({
      id: 'sess-new-2',
      name: 'Comp Grind',
      status: 'pending',
      trackComp: true,
    });
  });

  it('replaces existing active session entry when bulk result matches same characterId', () => {
    const bulkResults: BulkFireteamSessionResult[] = [
      {
        userId: 'user-1',
        characterId: 'char-hunter',
        outcome: 'skipped_active',
        session: {
          id: 'sess-active-1',
          userId: 'user-1',
          characterId: 'char-hunter',
          startedAt: '2026-11-25T00:00:00.000Z',
          status: 'pending',
          name: 'Existing Session',
          aggregateIds: ['g1', 'g2'],
        },
      },
    ];

    const member: FireteamMember = {
      ...baseMember,
      activeSessions: [
        {
          sessionId: 'sess-active-1',
          characterId: 'char-hunter',
          startedAt: new Date('2026-11-25T00:00:00Z'),
        },
      ],
    };

    const merged = getMemberActiveSessions(member, bulkResults);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      id: 'sess-active-1',
      name: 'Existing Session',
      aggregateIds: ['g1', 'g2'],
    });
  });
});

describe('findMemberBulkOutcome', () => {
  it('returns outcome matching member and characterId', () => {
    const bulkResults: BulkFireteamSessionResult[] = [
      {
        userId: 'user-1',
        characterId: 'char-warlock',
        outcome: 'started',
        session: {
          id: 'sess-2',
          userId: 'user-1',
          characterId: 'char-warlock',
          startedAt: '2026-11-25T00:10:00.000Z',
          aggregateIds: [],
        },
      },
    ];

    expect(findMemberBulkOutcome(baseMember, 'char-warlock', bulkResults)).toBe(
      'started',
    );
  });
});

describe('formatBulkStartSummary', () => {
  const makeResult = (
    userId: string,
    outcome: 'started' | 'skipped_active',
  ): BulkFireteamSessionResult => ({
    userId,
    characterId: `char-${userId}`,
    outcome,
    session: {
      id: `sess-${userId}`,
      userId,
      characterId: `char-${userId}`,
      startedAt: '2026-11-25T00:10:00.000Z',
      aggregateIds: [],
    },
  });

  it('formats mixed started and skipped_active results', () => {
    expect(
      formatBulkStartSummary([
        makeResult('u1', 'skipped_active'),
        makeResult('u2', 'started'),
        makeResult('u3', 'started'),
      ]),
    ).toEqual({
      title: 'Started 2 sessions; skipped 1 already active.',
      startedCount: 2,
      skippedCount: 1,
    });
  });

  it('formats single and multiple started results', () => {
    expect(formatBulkStartSummary([makeResult('u1', 'started')]).title).toBe(
      'Started 1 fireteam session.',
    );
    expect(
      formatBulkStartSummary([
        makeResult('u1', 'started'),
        makeResult('u2', 'started'),
      ]).title,
    ).toBe('Started 2 fireteam sessions.');
  });

  it('formats all skipped_active results', () => {
    expect(
      formatBulkStartSummary([makeResult('u1', 'skipped_active')]).title,
    ).toBe('1 teammate already has an active session.');
    expect(
      formatBulkStartSummary([
        makeResult('u1', 'skipped_active'),
        makeResult('u2', 'skipped_active'),
      ]).title,
    ).toBe('2 teammates already have active sessions.');
  });
});
