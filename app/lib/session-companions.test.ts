import { describe, expect, it } from 'vitest';
import type {
  Aggregate,
  CharacterSnapshot,
  PlayerStats,
  Session,
  SessionCompanion,
  SessionParticipant,
} from '~/api';
import {
  ENERGY_BUCKET,
  KINETIC_BUCKET,
  SUBCLASS_BUCKET,
} from '~/hooks/use-loadout';

import {
  areFireteamCompanions,
  filterAggregatesByCompanions,
  filterOwnerSnapshots,
  formatCompanionRecord,
  formatSelectedCompanionNames,
  formatSharedMatchCount,
  getCompanionCharacterIds,
  getCompanionPrimaryEmblem,
  getCompanionSessionPath,
  getMatchCompanions,
  isCompanionInAggregate,
  parseSelectedTeammateIds,
  resolveSessionCompanions,
} from './session-companions';

function makeStats({
  kills = 10,
  deaths = 5,
  assists = 3,
  standing = 0,
  team,
  fireTeamId,
  fireTeamIdDisplay,
}: {
  kills?: number;
  deaths?: number;
  assists?: number;
  standing?: number;
  team?: number;
  fireTeamId?: number;
  fireTeamIdDisplay?: string;
}): PlayerStats {
  return {
    kills: { value: kills },
    deaths: { value: deaths },
    assists: { value: assists },
    standing: { value: standing },
    ...(team !== undefined ? { team: { value: team } } : {}),
    ...(fireTeamId !== undefined
      ? {
          fireTeamId: {
            value: fireTeamId,
            ...(fireTeamIdDisplay ? { displayValue: fireTeamIdDisplay } : {}),
          },
        }
      : {}),
  };
}

function makeAggregate(
  id: string,
  options: {
    isPrivate?: boolean;
    ownerCharId?: string;
    ownerStats?: PlayerStats;
    companions?: Array<{
      charId: string;
      sessionId?: string;
      snapshotId?: string;
      stats?: PlayerStats;
      userId?: string;
      displayName?: string;
      characterClass?: string;
      emblemUrl?: string;
    }>;
  } = {},
): Aggregate {
  const ownerCharId = options.ownerCharId ?? 'char-owner';
  const snapshotLinks: Aggregate['snapshotLinks'] = {
    [ownerCharId]: {
      characterId: ownerCharId,
      snapshotId: 'snap-owner',
      sessionId: 'sess-owner',
      confidenceLevel: 'high',
      confidenceSource: 'system',
      createdAt: new Date('2026-11-27T01:00:00Z'),
    },
  };
  const performance: Aggregate['performance'] = {
    [ownerCharId]: {
      playerStats:
        options.ownerStats ?? makeStats({ standing: 0, fireTeamId: 12345 }),
      weapons: {},
    },
  };

  for (const c of options.companions ?? []) {
    snapshotLinks[c.charId] = {
      characterId: c.charId,
      snapshotId: c.snapshotId,
      sessionId: c.sessionId,
      confidenceLevel: 'high',
      confidenceSource: 'system',
      createdAt: new Date('2026-11-27T01:00:00Z'),
      userId: c.userId,
      displayName: c.displayName,
      characterClass: c.characterClass,
      emblemUrl: c.emblemUrl,
    };
    if (c.stats) {
      performance[c.charId] = {
        playerStats: c.stats,
        weapons: {},
      };
    }
  }

  return {
    id,
    activityId: `act-${id}`,
    sessionIds: ['sess-owner'],
    characterIds: Object.keys(snapshotLinks),
    snapshotIds: [],
    activityDetails: {
      instanceId: `inst-${id}`,
      period: new Date('2026-11-27T01:00:00Z'),
      activity: 'Control',
      description: 'Control match',
      referenceId: 1n,
      activityHash: 2n,
      mode: 'Control',
      location: 'Javelin-4',
      imageUrl: '/jav4.jpg',
      activityIcon: '/control.png',
      isPrivate: options.isPrivate ?? false,
    },
    snapshotLinks,
    performance,
    createdAt: new Date('2026-11-27T01:00:00Z'),
  };
}

function makeSnapshot(
  id: string,
  characterId: string,
  options?: {
    weaponName?: string;
    subclassName?: string;
    enhanced?: boolean;
  },
): CharacterSnapshot {
  return {
    id,
    userId: 'user-other',
    characterId,
    name: 'Companion Loadout',
    hash: `hash-${id}`,
    createdAt: new Date('2026-11-27T01:00:00Z'),
    updatedAt: new Date('2026-11-27T01:00:00Z'),
    loadout: {
      [SUBCLASS_BUCKET]: {
        itemHash: 3284755031n,
        instanceId: 'sub-1',
        name: options?.subclassName ?? 'Striker',
        details: {
          baseInfo: {
            name: options?.subclassName ?? 'Striker',
            icon: '/common/destiny2_content/icons/arc.png',
            itemHash: 3284755031n,
            instanceId: 'sub-1',
            bucketHash: BigInt(SUBCLASS_BUCKET),
            tierType: 2,
            tierTypeName: 'Basic',
            itemTypeDisplayName: 'Subclass',
            itemTypeAndTierDisplayName: 'Subclass',
          },
          stats: {},
          perks: [],
          sockets: [],
        },
      },
      [KINETIC_BUCKET]: {
        itemHash: 1111n,
        instanceId: 'w-1',
        name: options?.weaponName ?? 'Rose',
        details: {
          baseInfo: {
            name: options?.weaponName ?? 'Rose',
            icon: '/common/destiny2_content/icons/rose.png',
            itemHash: 1111n,
            instanceId: 'w-1',
            bucketHash: BigInt(KINETIC_BUCKET),
            tierType: 5,
            tierTypeName: 'Legendary',
            itemTypeDisplayName: 'Hand Cannon',
            itemTypeAndTierDisplayName: 'Legendary Hand Cannon',
          },
          stats: {},
          perks: [],
          sockets: options?.enhanced
            ? [
                {
                  name: 'Enhanced Intrinsic',
                  description: '',
                  icon: '',
                  isEnabled: true,
                  isVisible: true,
                  itemTypeDisplayName: 'Enhanced Intrinsic',
                  itemTypeTieredDisplayName: 'Enhanced Intrinsic',
                  plugHash: 999,
                },
              ]
            : [],
        },
      },
      [ENERGY_BUCKET]: {
        itemHash: 2222n,
        instanceId: 'w-2',
        name: 'Matador 64',
        details: {
          baseInfo: {
            name: 'Matador 64',
            icon: '/common/destiny2_content/icons/matador.png',
            itemHash: 2222n,
            instanceId: 'w-2',
            bucketHash: BigInt(ENERGY_BUCKET),
            tierType: 5,
            tierTypeName: 'Legendary',
            itemTypeDisplayName: 'Shotgun',
            itemTypeAndTierDisplayName: 'Legendary Shotgun',
          },
          stats: {},
          perks: [],
          sockets: [],
        },
      },
    },
  };
}

describe('session-companions domain helpers', () => {
  it('matches fireteam companions only when non-zero fireTeamId and team/standing match', () => {
    expect(
      areFireteamCompanions(
        makeStats({ fireTeamId: 500, standing: 0 }),
        makeStats({ fireTeamId: 500, standing: 0 }),
      ),
    ).toBe(true);

    expect(
      areFireteamCompanions(
        makeStats({ fireTeamId: 0, standing: 0 }),
        makeStats({ fireTeamId: 0, standing: 0 }),
      ),
    ).toBe(false);

    expect(
      areFireteamCompanions(
        makeStats({ fireTeamId: 500, team: 17 }),
        makeStats({ fireTeamId: 500, team: 18 }),
      ),
    ).toBe(false);

    expect(
      areFireteamCompanions(
        makeStats({
          fireTeamId: -8792482752189693000,
          fireTeamIdDisplay: '-8792482752189693111',
          standing: 0,
        }),
        makeStats({
          fireTeamId: -8792482752189693000,
          fireTeamIdDisplay: '-8792482752189693222',
          standing: 0,
        }),
      ),
    ).toBe(false);
  });

  it('excludes private matches and opposing-team tracked players in isCompanionInAggregate', () => {
    const privateAgg = makeAggregate('priv', {
      isPrivate: true,
      companions: [
        {
          charId: 'char-tragic',
          stats: makeStats({ fireTeamId: 12345, standing: 0 }),
        },
      ],
    });
    expect(
      isCompanionInAggregate(privateAgg, 'char-owner', 'char-tragic'),
    ).toBe(false);

    const opponentAgg = makeAggregate('opp', {
      ownerStats: makeStats({ fireTeamId: 12345, standing: 0, team: 17 }),
      companions: [
        {
          charId: 'char-tragic',
          stats: makeStats({ fireTeamId: 99999, standing: 1, team: 18 }),
        },
      ],
    });
    expect(
      isCompanionInAggregate(opponentAgg, 'char-owner', 'char-tragic'),
    ).toBe(false);
  });

  it('prefers precomputed session.summary.companions when present', () => {
    const precomputed: SessionCompanion[] = [
      {
        userId: 'user-tragic',
        displayName: 'Tragic',
        sharedMatches: 3,
        wins: 2,
        losses: 1,
        sessions: [
          {
            sessionId: 'sess-tragic',
            characterId: 'char-tragic',
            class: 'Titan',
            sharedMatches: 3,
          },
        ],
      },
    ];
    const session = {
      id: 'sess-owner',
      userId: 'user-owner',
      characterId: 'char-owner',
      status: 'complete',
      startedAt: new Date(),
      summary: { companions: precomputed },
    } as Session;

    expect(resolveSessionCompanions(session, [], {}, 'char-owner')).toEqual(
      precomputed,
    );
  });

  it('derives companions from aggregates and participants when summary.companions is absent (including multi-session character swaps)', () => {
    const session = {
      id: 'sess-owner',
      userId: 'user-owner',
      characterId: 'char-owner',
      status: 'complete',
      startedAt: new Date(),
    } as Session;

    const participants: Record<string, SessionParticipant> = {
      'char-tragic-titan': {
        userId: 'user-tragic',
        displayName: 'Tragic',
        characterId: 'char-tragic-titan',
        class: 'Titan',
        emblemUrl: '/img/titan.jpg',
      },
      'char-tragic-warlock': {
        userId: 'user-tragic',
        displayName: 'Tragic',
        characterId: 'char-tragic-warlock',
        class: 'Warlock',
        emblemUrl: '/img/warlock.jpg',
      },
    };

    const aggregates: Aggregate[] = [
      makeAggregate('m1', {
        ownerStats: makeStats({ fireTeamId: 100, standing: 0 }),
        companions: [
          {
            charId: 'char-tragic-titan',
            sessionId: 'sess-t1',
            stats: makeStats({ fireTeamId: 100, standing: 0 }),
          },
        ],
      }),
      makeAggregate('m2', {
        ownerStats: makeStats({ fireTeamId: 100, standing: 1 }),
        companions: [
          {
            charId: 'char-tragic-titan',
            sessionId: 'sess-t1',
            stats: makeStats({ fireTeamId: 100, standing: 1 }),
          },
        ],
      }),
      makeAggregate('m3', {
        ownerStats: makeStats({ fireTeamId: 200, standing: 0 }),
        companions: [
          {
            charId: 'char-tragic-warlock',
            sessionId: 'sess-w2',
            stats: makeStats({ fireTeamId: 200, standing: 0 }),
          },
        ],
      }),
      makeAggregate('m4-solo'),
    ];

    const companions = resolveSessionCompanions(
      session,
      aggregates,
      participants,
      'char-owner',
    );

    expect(companions).toHaveLength(1);
    expect(companions[0]).toEqual({
      userId: 'user-tragic',
      displayName: 'Tragic',
      sharedMatches: 3,
      wins: 2,
      losses: 1,
      sessions: [
        {
          sessionId: 'sess-t1',
          characterId: 'char-tragic-titan',
          class: 'Titan',
          emblemUrl: '/img/titan.jpg',
          sharedMatches: 2,
        },
        {
          sessionId: 'sess-w2',
          characterId: 'char-tragic-warlock',
          class: 'Warlock',
          emblemUrl: '/img/warlock.jpg',
          sharedMatches: 1,
        },
      ],
    });
  });

  it('filters partial drop-in sessions and multi-character swaps for a selected companion', () => {
    const companion: SessionCompanion = {
      userId: 'user-tragic',
      displayName: 'Tragic',
      sharedMatches: 3,
      wins: 2,
      losses: 1,
      sessions: [
        {
          sessionId: 'sess-t1',
          characterId: 'char-tragic-titan',
          class: 'Titan',
          sharedMatches: 2,
        },
        {
          sessionId: 'sess-w2',
          characterId: 'char-tragic-warlock',
          class: 'Warlock',
          sharedMatches: 1,
        },
      ],
    };

    const aggregates: Aggregate[] = [
      makeAggregate('m1-solo'),
      makeAggregate('m2-titan', {
        ownerStats: makeStats({ fireTeamId: 100, standing: 0 }),
        companions: [
          {
            charId: 'char-tragic-titan',
            stats: makeStats({ fireTeamId: 100, standing: 0 }),
          },
        ],
      }),
      makeAggregate('m3-warlock', {
        ownerStats: makeStats({ fireTeamId: 200, standing: 0 }),
        companions: [
          {
            charId: 'char-tragic-warlock',
            stats: makeStats({ fireTeamId: 200, standing: 0 }),
          },
        ],
      }),
      makeAggregate('m4-opponent', {
        ownerStats: makeStats({ fireTeamId: 300, standing: 0 }),
        companions: [
          {
            charId: 'char-tragic-titan',
            stats: makeStats({ fireTeamId: 400, standing: 1 }),
          },
        ],
      }),
    ];

    expect(Array.from(getCompanionCharacterIds(companion))).toEqual([
      'char-tragic-titan',
      'char-tragic-warlock',
    ]);

    const filtered = filterAggregatesByCompanions(aggregates, 'char-owner', [
      companion,
    ]);
    expect(filtered.map((a) => a.id)).toEqual(['m2-titan', 'm3-warlock']);
  });

  it('applies AND semantics when filtering by multiple teammates simultaneously', () => {
    const tragic: SessionCompanion = {
      userId: 'user-tragic',
      displayName: 'Tragic',
      sharedMatches: 2,
      wins: 2,
      losses: 0,
      sessions: [
        {
          sessionId: 'sess-t',
          characterId: 'char-tragic',
          class: 'Titan',
          sharedMatches: 2,
        },
      ],
    };
    const nova: SessionCompanion = {
      userId: 'user-nova',
      displayName: 'Nova',
      sharedMatches: 2,
      wins: 2,
      losses: 0,
      sessions: [
        {
          sessionId: 'sess-n',
          characterId: 'char-nova',
          class: 'Warlock',
          sharedMatches: 2,
        },
      ],
    };

    const aggregates: Aggregate[] = [
      makeAggregate('m1-both', {
        ownerStats: makeStats({ fireTeamId: 100, standing: 0 }),
        companions: [
          {
            charId: 'char-tragic',
            stats: makeStats({ fireTeamId: 100, standing: 0 }),
          },
          {
            charId: 'char-nova',
            stats: makeStats({ fireTeamId: 100, standing: 0 }),
          },
        ],
      }),
      makeAggregate('m2-tragic-only', {
        ownerStats: makeStats({ fireTeamId: 200, standing: 0 }),
        companions: [
          {
            charId: 'char-tragic',
            stats: makeStats({ fireTeamId: 200, standing: 0 }),
          },
        ],
      }),
      makeAggregate('m3-nova-only', {
        ownerStats: makeStats({ fireTeamId: 300, standing: 0 }),
        companions: [
          {
            charId: 'char-nova',
            stats: makeStats({ fireTeamId: 300, standing: 0 }),
          },
        ],
      }),
      makeAggregate('m4-solo'),
    ];

    const filteredBoth = filterAggregatesByCompanions(
      aggregates,
      'char-owner',
      [tragic, nova],
    );
    expect(filteredBoth.map((a) => a.id)).toEqual(['m1-both']);

    const params = new URLSearchParams(
      'teammate=user-tragic&teammate=user-nova&teammate=user-tragic&teammate=unknown',
    );
    expect(parseSelectedTeammateIds(params, [tragic, nova])).toEqual([
      'user-tragic',
      'user-nova',
    ]);

    expect(formatSelectedCompanionNames([tragic])).toBe('Tragic');
    expect(formatSelectedCompanionNames([tragic, nova])).toBe('Tragic & Nova');
    expect(
      formatSelectedCompanionNames([
        tragic,
        nova,
        { ...tragic, userId: 'user-kira', displayName: 'Kira' },
      ]),
    ).toBe('Tragic, Nova & Kira');
  });

  it('hydrates match companion stats, emblem, subclass, and weapon icons from participants and snapshots', () => {
    const participants: Record<string, SessionParticipant> = {
      'char-tragic': {
        userId: 'user-tragic',
        displayName: 'Tragic',
        characterId: 'char-tragic',
        class: 'Titan',
        emblemUrl: '/common/destiny2_content/icons/emblem.jpg',
      },
    };
    const snapshots: Record<string, CharacterSnapshot> = {
      'snap-tragic': makeSnapshot('snap-tragic', 'char-tragic', {
        weaponName: 'Rose',
        subclassName: 'Striker',
        enhanced: true,
      }),
    };
    const agg = makeAggregate('m1', {
      ownerStats: makeStats({ fireTeamId: 100, standing: 0 }),
      companions: [
        {
          charId: 'char-tragic',
          sessionId: 'sess-tragic',
          snapshotId: 'snap-tragic',
          stats: makeStats({
            kills: 18,
            deaths: 9,
            assists: 6,
            fireTeamId: 100,
            standing: 0,
          }),
        },
      ],
    });

    const matchCompanions = getMatchCompanions(
      agg,
      'char-owner',
      'user-owner',
      participants,
      snapshots,
    );

    expect(matchCompanions).toHaveLength(1);
    expect(matchCompanions[0]).toMatchObject({
      characterId: 'char-tragic',
      userId: 'user-tragic',
      displayName: 'Tragic',
      characterClass: 'Titan',
      emblemUrl:
        'https://www.bungie.net/common/destiny2_content/icons/emblem.jpg',
      sessionId: 'sess-tragic',
      kills: 18,
      deaths: 9,
      assists: 6,
      kd: 2,
      hasPerformance: true,
      subclassName: 'Striker',
      subclassIcon:
        'https://www.bungie.net/common/destiny2_content/icons/arc.png',
    });
    expect(matchCompanions[0].weapons).toEqual([
      {
        itemHash: '1111',
        name: 'Rose',
        icon: 'https://www.bungie.net/common/destiny2_content/icons/rose.png',
        isEnhanced: true,
        hasActiveCatalyst: false,
      },
      {
        itemHash: '2222',
        name: 'Matador 64',
        icon: 'https://www.bungie.net/common/destiny2_content/icons/matador.png',
        isEnhanced: false,
        hasActiveCatalyst: false,
      },
    ]);
  });

  it('formats companion paths, emblems, records, and filters owner snapshots', () => {
    expect(
      getCompanionSessionPath('user-tragic', {
        characterId: 'char-tragic',
        sessionId: 'sess-tragic',
      }),
    ).toBe('/profile/user-tragic/c/char-tragic/sessions/sess-tragic');

    expect(
      getCompanionSessionPath('user-tragic', {
        characterId: 'char-tragic',
        sessionId: '',
      }),
    ).toBe('/profile/user-tragic/c/char-tragic');

    expect(
      getCompanionPrimaryEmblem({
        userId: 'user-tragic',
        displayName: 'Tragic',
        sharedMatches: 2,
        wins: 2,
        losses: 0,
        sessions: [
          {
            sessionId: 'sess-1',
            characterId: 'char-1',
            emblemUrl: '/img/emblem.jpg',
            sharedMatches: 2,
          },
        ],
      }),
    ).toBe('https://www.bungie.net/img/emblem.jpg');

    expect(formatSharedMatchCount(1)).toBe('1 match');
    expect(formatSharedMatchCount(3)).toBe('3 matches');
    expect(formatSharedMatchCount(3, 6)).toBe('3/6 matches');
    expect(formatCompanionRecord(2, 1)).toBe('2W-1L');

    const ownerSnap = makeSnapshot('snap-owner', 'char-owner');
    const companionSnap = makeSnapshot('snap-tragic', 'char-tragic');
    expect(
      filterOwnerSnapshots(
        { 'snap-owner': ownerSnap, 'snap-tragic': companionSnap },
        'char-owner',
      ).map((s) => s.id),
    ).toEqual(['snap-owner']);
  });
});
