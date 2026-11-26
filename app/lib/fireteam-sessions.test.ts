import { describe, expect, it } from 'vitest';
import type { FireteamMember, FireteamSessionResult } from '~/api';

import {
  buildFireteamCharacterMap,
  buildFireteamViewModel,
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

describe('buildFireteamCharacterMap', () => {
  it('maps both id and membershipId to each member default character', () => {
    const result = buildFireteamCharacterMap([baseMember], {
      'user-1': 'char-warlock',
    });

    expect(result).toEqual({
      'user-1': 'char-warlock',
      'mem-1': 'char-warlock',
    });
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
    const bulkResults: FireteamSessionResult[] = [
      {
        userId: 'user-1',
        characterId: 'char-warlock',
        outcome: 'started',
        session: {
          id: 'sess-new-2',
          userId: 'user-1',
          characterId: 'char-warlock',
          startedAt: new Date('2026-11-25T00:10:00.000Z'),
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
    const bulkResults: FireteamSessionResult[] = [
      {
        userId: 'user-1',
        characterId: 'char-hunter',
        outcome: 'skipped_active',
        session: {
          id: 'sess-active-1',
          userId: 'user-1',
          characterId: 'char-hunter',
          startedAt: new Date('2026-11-25T00:00:00.000Z'),
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
  const bulkResults: FireteamSessionResult[] = [
    {
      userId: 'user-1',
      characterId: 'char-warlock',
      outcome: 'started',
      session: {
        id: 'sess-2',
        userId: 'user-1',
        characterId: 'char-warlock',
        startedAt: new Date('2026-11-25T00:10:00.000Z'),
        aggregateIds: [],
      },
    },
  ];

  it('returns outcome matching member and characterId', () => {
    expect(findMemberBulkOutcome(baseMember, 'char-warlock', bulkResults)).toBe(
      'started',
    );
  });

  it('returns undefined when characterId is provided and does not match any bulk result', () => {
    expect(
      findMemberBulkOutcome(baseMember, 'char-hunter', bulkResults),
    ).toBeUndefined();
  });

  it('falls back to first matching outcome only when characterId is omitted', () => {
    expect(findMemberBulkOutcome(baseMember, undefined, bulkResults)).toBe(
      'started',
    );
  });
});

describe('buildFireteamViewModel', () => {
  it('computes views, names, targets, and active/ready counts in a single pass', () => {
    const activeMember: FireteamMember = {
      ...baseMember,
      activeSessions: [
        {
          sessionId: 'sess-w',
          characterId: 'char-warlock',
          startedAt: new Date('2026-11-25T00:00:00Z'),
        },
      ],
    };

    const inactiveMember: FireteamMember = {
      id: 'user-2',
      membershipId: 'mem-2',
      displayName: 'ReadyTitan',
      characters: [
        {
          id: 'char-titan',
          class: 'Titan',
          race: 'Exo',
          light: BigInt(2020),
          emblemURL: '/emblem-t.png',
          emblemBackgroundURL: '/bg-t.png',
          currentTitle: 'Iron Lord',
          emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
        },
      ],
    };

    const viewModel = buildFireteamViewModel({
      members: [activeMember, inactiveMember],
      fireteamMemWithCharacters: {
        'user-1': 'char-warlock',
        'user-2': 'char-titan',
      },
      draftCharacters: {
        'user-1': 'char-hunter',
      },
      excludedMemberIds: {},
    });

    expect(viewModel.memberNames).toEqual({
      'user-1': 'HunterGuardian',
      'mem-1': 'HunterGuardian',
      'user-2': 'ReadyTitan',
      'mem-2': 'ReadyTitan',
    });
    expect(viewModel.readyCount).toBe(2);
    expect(viewModel.activeHeaderCount).toBe(1);
    expect(viewModel.activeSelectedCount).toBe(0);
    expect(viewModel.selectedTargets).toEqual([
      { userId: 'user-1', characterId: 'char-hunter' },
      { userId: 'user-2', characterId: 'char-titan' },
    ]);

    expect(viewModel.memberViews[0].selectedActiveSession).toBeUndefined();
    expect(viewModel.memberViews[0].otherActiveSession?.id).toBe('sess-w');
    expect(viewModel.memberViews[0].otherActiveCharacterClass).toBe('Warlock');
  });

  it('resolves pre-indexed bulkResults and visibleResults matched by member id or membershipId', () => {
    const secondMember: FireteamMember = {
      id: 'user-2',
      membershipId: 'mem-2',
      displayName: 'ReadyTitan',
      characters: [
        {
          id: 'char-titan',
          class: 'Titan',
          race: 'Exo',
          light: BigInt(2020),
          emblemURL: '/emblem-t.png',
          emblemBackgroundURL: '/bg-t.png',
          currentTitle: 'Iron Lord',
          emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
        },
      ],
    };

    const bulkResults: FireteamSessionResult[] = [
      {
        userId: 'user-1',
        characterId: 'char-hunter',
        outcome: 'started',
        session: {
          id: 'sess-h',
          userId: 'user-1',
          characterId: 'char-hunter',
          startedAt: new Date('2026-11-25T00:10:00Z'),
          status: 'pending',
          aggregateIds: [],
        },
      },
      {
        userId: 'mem-2',
        characterId: 'char-titan',
        outcome: 'skipped_active',
        session: {
          id: 'sess-t',
          userId: 'mem-2',
          characterId: 'char-titan',
          startedAt: new Date('2026-11-25T00:05:00Z'),
          status: 'pending',
          aggregateIds: [],
        },
      },
    ];

    const viewModel = buildFireteamViewModel({
      members: [baseMember, secondMember],
      fireteamMemWithCharacters: {
        'user-1': 'char-hunter',
        'user-2': 'char-titan',
      },
      draftCharacters: {},
      excludedMemberIds: {},
      bulkResults,
      visibleResults: bulkResults,
    });

    expect(viewModel.memberViews[0].selectedActiveSession?.id).toBe('sess-h');
    expect(viewModel.memberViews[0].bulkOutcome).toBe('started');
    expect(viewModel.memberViews[1].selectedActiveSession?.id).toBe('sess-t');
    expect(viewModel.memberViews[1].bulkOutcome).toBe('skipped_active');
    expect(viewModel.activeHeaderCount).toBe(2);
    expect(viewModel.readyCount).toBe(0);
  });
});

describe('formatBulkStartSummary', () => {
  const makeResult = (
    userId: string,
    outcome: 'started' | 'skipped_active',
  ): FireteamSessionResult => ({
    userId,
    characterId: `char-${userId}`,
    outcome,
    session: {
      id: `sess-${userId}`,
      userId,
      characterId: `char-${userId}`,
      startedAt: new Date('2026-11-25T00:10:00.000Z'),
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
