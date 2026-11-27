import { describe, expect, it } from 'vitest';
import type {
  ActivityParticipant,
  CharacterSnapshot,
  Team,
  WeaponInstanceMetrics,
} from '~/api';

import {
  buildMatchScoreboardViewModel,
  computeParticipantStats,
  countTrackedParticipants,
  getParticipantTrackingKind,
  getSnapshotExoticArmorPreview,
  getSnapshotSubclassPreview,
  resolveFireteamKey,
  sortParticipantWeapons,
} from './match-scoreboard';

function makeWeapon(
  id: number,
  name: string,
  bucketHash: number,
  kills: number,
): WeaponInstanceMetrics {
  return {
    referenceId: BigInt(id),
    bucketHash: BigInt(bucketHash),
    itemTypeDisplayName: 'Hand Cannon',
    display: {
      name,
      description: `Legendary ${name}`,
      icon: `/icons/${id}.jpg`,
      hasIcon: true,
    },
    stats: {
      uniqueWeaponKills: {
        basic: { value: kills, displayValue: String(kills) },
      },
    },
  };
}

function makeParticipant(
  overrides: Partial<ActivityParticipant> & {
    characterId: string;
    displayName: string;
  },
): ActivityParticipant {
  return {
    membershipId: `mem-${overrides.characterId}`,
    membershipType: 1,
    characterClass: 'Hunter',
    lightLevel: 547,
    emblemIconUrl: 'https://www.bungie.net/common/emblem.jpg',
    standing: 0,
    completed: true,
    score: { value: 10, displayValue: '10' },
    performance: {
      playerStats: {
        kills: { value: 10, displayValue: '10' },
        deaths: { value: 5, displayValue: '5' },
        assists: { value: 4, displayValue: '4' },
        kd: { value: 2, displayValue: '2.00' },
        kda: { value: 2.4, displayValue: '2.40' },
      },
      weapons: {},
    },
    ...overrides,
  };
}

function makeSnapshot(
  characterId: string,
  userId = 'user-1',
): CharacterSnapshot {
  return {
    id: `snap-${characterId}`,
    name: `Snapshot ${characterId}`,
    userId,
    characterId,
    createdAt: new Date('2026-11-26T00:00:00Z'),
    updatedAt: new Date('2026-11-26T00:00:00Z'),
    hash: 'hash-1',
    loadout: {},
    stats: {},
  };
}

const TEAMS: Team[] = [
  { id: '20', teamName: '20', score: '42', standing: 'Defeat' },
  { id: '19', teamName: '19', score: '75', standing: 'Victory' },
];

describe('match-scoreboard view model helpers', () => {
  it('groups two-team matches into Alpha (lower team id) and Bravo ordered by performance', () => {
    const participants = [
      makeParticipant({
        characterId: 'b-low',
        displayName: 'BravoLow',
        teamId: '20',
        standing: 1,
        score: { value: 8, displayValue: '8' },
      }),
      makeParticipant({
        characterId: 'a-top',
        displayName: 'AlphaTop',
        teamId: '19',
        standing: 0,
        score: { value: 24, displayValue: '24' },
        userId: 'user-1',
        sessionId: 'sess-1',
        snapshotId: 'snap-a-top',
        confidenceLevel: 'high',
      }),
      makeParticipant({
        characterId: 'a-mid',
        displayName: 'AlphaMid',
        teamId: '19',
        standing: 0,
        score: { value: 14, displayValue: '14' },
        userId: 'user-2',
        sessionId: 'sess-2',
        confidenceLevel: 'noMatch',
      }),
      makeParticipant({
        characterId: 'b-top',
        displayName: 'BravoTop',
        teamId: '20',
        standing: 1,
        score: { value: 19, displayValue: '19' },
      }),
    ];

    const snapshots = { 'a-top': makeSnapshot('a-top', 'user-1') };

    const vm = buildMatchScoreboardViewModel({
      participants,
      teams: TEAMS,
      snapshots,
    });

    expect(vm.mode).toBe('teams');
    expect(vm.groups).toHaveLength(2);
    expect(vm.groups[0].label).toBe('Alpha');
    expect(vm.groups[0].teamTone).toBe('alpha');
    expect(vm.groups[0].standing).toBe('Victory');
    expect(vm.groups[0].score).toBe('75');
    expect(vm.groups[0].entries.map((e) => e.participant.characterId)).toEqual([
      'a-top',
      'a-mid',
    ]);
    expect(vm.groups[0].entries[0].trackingKind).toBe('loadout');
    expect(vm.groups[0].entries[1].trackingKind).toBe('session');

    expect(vm.groups[1].label).toBe('Bravo');
    expect(vm.groups[1].teamTone).toBe('bravo');
    expect(vm.groups[1].standing).toBe('Defeat');
    expect(vm.groups[1].score).toBe('42');
    expect(vm.groups[1].entries.map((e) => e.participant.characterId)).toEqual([
      'b-top',
      'b-low',
    ]);
    expect(vm.groups[1].entries[0].trackingKind).toBe('none');

    expect(vm.counts).toEqual({
      participantCount: 4,
      trackedLoadoutCount: 1,
      trackedSessionCount: 2,
      trackedPlayerCount: 2,
    });
  });

  it('falls back to a single Standings group ordered by placement and score in FFA / Rumble', () => {
    const participants = [
      makeParticipant({
        characterId: 'p3',
        displayName: 'ThirdPlace',
        standing: 2,
        score: { value: 12, displayValue: '12' },
      }),
      makeParticipant({
        characterId: 'p1',
        displayName: 'FirstPlace',
        standing: 0,
        score: { value: 20, displayValue: '20' },
      }),
      makeParticipant({
        characterId: 'p2',
        displayName: 'SecondPlace',
        standing: 1,
        score: { value: 17, displayValue: '17' },
      }),
    ];

    const vm = buildMatchScoreboardViewModel({
      participants,
      teams: [],
      snapshots: {},
    });

    expect(vm.mode).toBe('ffa');
    expect(vm.groups).toHaveLength(1);
    expect(vm.groups[0].label).toBe('Standings');
    expect(vm.groups[0].teamTone).toBe('neutral');
    expect(vm.groups[0].entries.map((e) => e.participant.characterId)).toEqual([
      'p1',
      'p2',
      'p3',
    ]);
  });

  it('detects shared pre-made fireteam stacks while ignoring Bungie INT32 overflow sentinel', () => {
    const overflowDuoA = makeParticipant({
      characterId: 'duo-1',
      displayName: 'DuoA',
      teamId: '19',
      fireteamId: '-2147483648',
      performance: {
        playerStats: {
          kills: { value: 12 },
          deaths: { value: 4 },
          assists: { value: 2 },
          fireTeamId: { value: 9876543210, displayValue: '-2147483648' },
        },
        weapons: {},
      },
    });
    const overflowDuoB = makeParticipant({
      characterId: 'duo-2',
      displayName: 'DuoB',
      teamId: '19',
      fireteamId: '-2147483648',
      performance: {
        playerStats: {
          kills: { value: 8 },
          deaths: { value: 4 },
          assists: { value: 2 },
          fireTeamId: { value: 9876543210, displayValue: '-2147483648' },
        },
        weapons: {},
      },
    });
    const soloWithOverflow = makeParticipant({
      characterId: 'solo-1',
      displayName: 'SoloPlayer',
      teamId: '19',
      fireteamId: '-2147483648',
      performance: {
        playerStats: {
          kills: { value: 5 },
          deaths: { value: 5 },
          assists: { value: 1 },
          fireTeamId: { value: 1111111111, displayValue: '-2147483648' },
        },
        weapons: {},
      },
    });
    const bravoSolo = makeParticipant({
      characterId: 'bravo-1',
      displayName: 'BravoPlayer',
      teamId: '20',
      fireteamId: 'ft-solo-bravo',
    });

    expect(resolveFireteamKey(overflowDuoA)).toBe('9876543210');
    expect(resolveFireteamKey(bravoSolo)).toBe('ft-solo-bravo');

    const vm = buildMatchScoreboardViewModel({
      participants: [overflowDuoA, overflowDuoB, soloWithOverflow, bravoSolo],
      teams: TEAMS,
      snapshots: {},
    });

    const alphaEntries = vm.groups[0].entries;
    expect(vm.groups[0].hasTrackedPlayers).toBe(false);
    expect(vm.groups[1].hasTrackedPlayers).toBe(false);
    expect(alphaEntries[0].fireteamGroupIndex).toBe(1);
    expect(alphaEntries[0].fireteamStackSize).toBe(2);
    expect(alphaEntries[1].fireteamGroupIndex).toBe(1);
    expect(alphaEntries[1].fireteamStackSize).toBe(2);
    expect(alphaEntries[2].fireteamGroupIndex).toBeUndefined();
    expect(vm.groups[1].entries[0].fireteamGroupIndex).toBeUndefined();
  });

  it('ignores Bungie INT32 overflow sentinel when it appears on fireTeamId.value fallback', () => {
    const soloOverflowA = makeParticipant({
      characterId: 'solo-overflow-1',
      displayName: 'SoloOverflowA',
      teamId: '19',
      fireteamId: '-2147483648',
      performance: {
        playerStats: {
          kills: { value: 9 },
          deaths: { value: 4 },
          assists: { value: 2 },
          fireTeamId: { value: -2147483648, displayValue: '-2147483648' },
        },
        weapons: {},
      },
    });
    const soloOverflowB = makeParticipant({
      characterId: 'solo-overflow-2',
      displayName: 'SoloOverflowB',
      teamId: '19',
      fireteamId: '-2147483648',
      performance: {
        playerStats: {
          kills: { value: 7 },
          deaths: { value: 5 },
          assists: { value: 1 },
          fireTeamId: { value: -2147483648, displayValue: '-2147483648' },
        },
        weapons: {},
      },
    });

    expect(resolveFireteamKey(soloOverflowA)).toBeUndefined();
    expect(resolveFireteamKey(soloOverflowB)).toBeUndefined();

    const vm = buildMatchScoreboardViewModel({
      participants: [soloOverflowA, soloOverflowB],
      teams: TEAMS,
      snapshots: {},
    });

    expect(vm.groups[0].entries[0].fireteamGroupIndex).toBeUndefined();
    expect(vm.groups[0].entries[1].fireteamGroupIndex).toBeUndefined();
  });

  it('sorts players who left early to the bottom of their team even with a higher score', () => {
    const finisherLowScore = makeParticipant({
      characterId: 'finisher',
      displayName: 'FinishedMatch',
      teamId: '19',
      completed: true,
      score: { value: 11, displayValue: '11' },
    });
    const leaverHighScore = makeParticipant({
      characterId: 'leaver-high',
      displayName: 'LeftHighScore',
      teamId: '19',
      completed: false,
      score: { value: 25, displayValue: '25' },
    });
    const leaverLowScore = makeParticipant({
      characterId: 'leaver-low',
      displayName: 'LeftLowScore',
      teamId: '19',
      completed: false,
      score: { value: 4, displayValue: '4' },
    });
    const bravoPlayer = makeParticipant({
      characterId: 'bravo',
      displayName: 'BravoPlayer',
      teamId: '20',
      completed: true,
      score: { value: 15, displayValue: '15' },
    });

    const vm = buildMatchScoreboardViewModel({
      participants: [
        leaverHighScore,
        leaverLowScore,
        finisherLowScore,
        bravoPlayer,
      ],
      teams: TEAMS,
      snapshots: {},
    });

    expect(vm.groups[0].entries.map((e) => e.participant.characterId)).toEqual([
      'finisher',
      'leaver-high',
      'leaver-low',
    ]);
  });

  it('extracts subclass preview name and icon from character snapshot', () => {
    const snapshotWithSubclass: CharacterSnapshot = {
      ...makeSnapshot('c-sub'),
      loadout: {
        '3284755031': {
          name: 'Nightstalker',
          itemHash: BigInt(100),
          instanceId: 'sub-1',
          bucketHash: BigInt(3284755031),
          details: {
            baseInfo: {
              itemHash: BigInt(100),
              instanceId: 'sub-1',
              name: 'Nightstalker',
              icon: '/common/nightstalker.png',
              itemTypeDisplayName: 'Void Subclass',
              itemTypeAndTierDisplayName: 'Common Void Subclass',
              tierTypeName: 'Common',
              tierType: 2,
              bucketHash: BigInt(3284755031),
            },
            perks: [],
            stats: {},
            sockets: [],
          },
        },
      },
    };

    expect(getSnapshotSubclassPreview(snapshotWithSubclass)).toEqual({
      name: 'Nightstalker',
      icon: '/common/nightstalker.png',
    });
    expect(getSnapshotSubclassPreview(makeSnapshot('c-empty'))).toBeUndefined();
    expect(getSnapshotSubclassPreview(undefined)).toBeUndefined();
  });

  it('extracts equipped exotic armor preview while ignoring exotic weapons', () => {
    const snapshot: CharacterSnapshot = {
      ...makeSnapshot('c-exotic'),
      loadout: {
        '1498876634': {
          name: 'The Chaperone',
          itemHash: BigInt(200),
          instanceId: 'wep-1',
          bucketHash: BigInt(1498876634),
          details: {
            baseInfo: {
              itemHash: BigInt(200),
              instanceId: 'wep-1',
              name: 'The Chaperone',
              icon: '/common/chaperone.jpg',
              itemTypeDisplayName: 'Shotgun',
              itemTypeAndTierDisplayName: 'Exotic Shotgun',
              tierTypeName: 'Exotic',
              tierType: 6,
              bucketHash: BigInt(1498876634),
            },
            perks: [],
            stats: {},
            sockets: [],
          },
        },
        '14239492': {
          name: "The Dragon's Shadow",
          itemHash: BigInt(201),
          instanceId: 'arm-1',
          bucketHash: BigInt(14239492),
          details: {
            baseInfo: {
              itemHash: BigInt(201),
              instanceId: 'arm-1',
              name: "The Dragon's Shadow",
              icon: '/common/dragons-shadow.jpg',
              itemTypeDisplayName: 'Chest Armor',
              itemTypeAndTierDisplayName: 'Exotic Chest Armor',
              tierTypeName: 'Exotic',
              tierType: 6,
              bucketHash: BigInt(14239492),
            },
            perks: [],
            stats: {},
            sockets: [],
          },
        },
      },
    };

    expect(getSnapshotExoticArmorPreview(snapshot)).toEqual({
      name: "The Dragon's Shadow",
      icon: '/common/dragons-shadow.jpg',
    });
    expect(
      getSnapshotExoticArmorPreview(makeSnapshot('c-empty')),
    ).toBeUndefined();
  });

  it('sorts weapons by equipment slot (Kinetic -> Energy -> Power) then kills descending', () => {
    const sorted = sortParticipantWeapons({
      heavy: makeWeapon(1, 'Legend of Acrius', 953998645, 7),
      energy: makeWeapon(2, 'The Inquisitor', 2465295065, 2),
      kineticLow: makeWeapon(3, 'Ace of Spades', 1498876634, 3),
      kineticHigh: makeWeapon(4, "Crimil's Dagger", 1498876634, 9),
    });

    expect(sorted.map((w) => w.display?.name)).toEqual([
      "Crimil's Dagger",
      'Ace of Spades',
      'The Inquisitor',
      'Legend of Acrius',
    ]);
  });

  it('computes K/D and Efficiency ratios safely including zero deaths', () => {
    const flawless = makeParticipant({
      characterId: 'flawless',
      displayName: 'Flawless',
      performance: {
        playerStats: {
          kills: { value: 12 },
          deaths: { value: 0 },
          assists: { value: 5 },
        },
        weapons: {},
      },
    });

    expect(computeParticipantStats(flawless)).toEqual({
      kills: 12,
      deaths: 0,
      assists: 5,
      kd: '12.00',
      efficiency: '17.00',
      scoreDisplay: '10',
    });
  });

  it('classifies tracking kinds and counts accurately when snapshot is missing', () => {
    const withLoadout = makeParticipant({
      characterId: 'c1',
      displayName: 'One',
      sessionId: 's1',
      snapshotId: 'snap-1',
    });
    const sessionOnlyMissingSnap = makeParticipant({
      characterId: 'c2',
      displayName: 'Two',
      sessionId: 's2',
      snapshotId: 'snap-missing',
    });
    const registeredNoSession = makeParticipant({
      characterId: 'c3',
      displayName: 'Three',
      userId: 'u3',
    });

    const snapshots = { c1: makeSnapshot('c1') };

    expect(getParticipantTrackingKind(withLoadout, snapshots)).toBe('loadout');
    expect(getParticipantTrackingKind(sessionOnlyMissingSnap, snapshots)).toBe(
      'session',
    );
    expect(getParticipantTrackingKind(registeredNoSession, snapshots)).toBe(
      'none',
    );

    expect(
      countTrackedParticipants(
        [withLoadout, sessionOnlyMissingSnap, registeredNoSession],
        snapshots,
      ),
    ).toEqual({
      participantCount: 3,
      trackedLoadoutCount: 1,
      trackedSessionCount: 2,
      trackedPlayerCount: 2,
    });
  });
});
