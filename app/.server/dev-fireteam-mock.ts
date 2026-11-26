import { subMinutes } from 'date-fns';
import { getPreferences } from '~/.server/preferences';
import type {
  FireteamMember,
  FireteamSessionMemberTarget,
  FireteamSessionOutcome,
  FireteamSessionResult,
} from '~/api';

export type DevFireteamMockScenario =
  'mixed' | 'race' | 'all-active' | 'all-inactive';

const VALID_SCENARIOS = new Set<DevFireteamMockScenario>([
  'mixed',
  'race',
  'all-active',
  'all-inactive',
]);

const MIXED_ACTIVE_MINUTES_AGO = 12;
const ALL_ACTIVE_STAGGER_MINUTES = 9;

export function isDevMockAllowed(): boolean {
  return Boolean(
    import.meta.env.DEV &&
    (!process.env.NODE_ENV ||
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'),
  );
}

export function parseDevFireteamMockScenario(
  raw: string | null | undefined,
): DevFireteamMockScenario | undefined {
  if (!isDevMockAllowed() || !raw) return undefined;
  const normalized = raw.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true') {
    return 'mixed';
  }
  if (VALID_SCENARIOS.has(normalized as DevFireteamMockScenario)) {
    return normalized as DevFireteamMockScenario;
  }
  return undefined;
}

const MOCK_SESSION_IDS_BY_USER: Record<string, string> = {
  TTXWDT9pzDEA0XiO1iAc: 'rCGGPUGgiSMkVmgAEa89',
  PKmxjnMbBeDkGyzp2ICa: 'Xb5WKJNQJeqHvQNA4eX4',
  zUk4BWzsezGpYAs0TIzY: 'dZ3FQ4BXX6bXHOx9l09E',
};

function getMockSessionName(
  outcome: FireteamSessionOutcome,
  trackComp: boolean,
): string {
  if (outcome === 'skipped_active') {
    return 'Already Running Session';
  }
  return trackComp ? 'Comp Fireteam Grind' : 'Crucible Fireteam Session';
}

function buildBaseMockMembers(): FireteamMember[] {
  return [
    {
      id: 'TTXWDT9pzDEA0XiO1iAc',
      membershipId: '4611686018434106050',
      displayName: 'Zone 6 Weegee',
      characters: [
        {
          id: '2305843009261519028',
          class: 'Hunter',
          race: 'Human',
          light: BigInt(548),
          currentTitle: 'Iron Lord',
          emblemURL:
            'https://www.bungie.net/common/destiny2_content/icons/7c931d6e23ec89ef8579d83df85e752b.jpg',
          emblemBackgroundURL:
            'https://www.bungie.net/common/destiny2_content/icons/24dc9c0554fbf82515ea988c80fe2656.jpg',
          emblemColor: { red: 0, green: 0, blue: 10, alpha: 255 },
        },
        {
          id: '2305843009261519030',
          class: 'Warlock',
          race: 'Awoken',
          light: BigInt(68),
          currentTitle: 'Iron Lord',
          emblemURL:
            'https://www.bungie.net/common/destiny2_content/icons/116dd3b4c893a104c7b1b56a3453ee35.jpg',
          emblemBackgroundURL:
            'https://www.bungie.net/common/destiny2_content/icons/a5513eb805d16725121d0ac19e05e070.jpg',
          emblemColor: { red: 16, green: 1, blue: 2, alpha: 255 },
        },
        {
          id: '2305843009261519033',
          class: 'Titan',
          race: 'Awoken',
          light: BigInt(53),
          currentTitle: 'Conqueror',
          emblemURL:
            'https://www.bungie.net/common/destiny2_content/icons/03c9e0e4e0d22a60e2409b882c44eb18.jpg',
          emblemBackgroundURL:
            'https://www.bungie.net/common/destiny2_content/icons/0493664089f4e55fedc8b6d08812121f.jpg',
          emblemColor: { red: 22, green: 20, blue: 44, alpha: 255 },
        },
      ],
    },
    {
      id: 'PKmxjnMbBeDkGyzp2ICa',
      membershipId: '4611686018458898255',
      displayName: 'Mr. Greedy',
      characters: [
        {
          id: '2305843009319907556',
          class: 'Warlock',
          race: 'Human',
          light: BigInt(550),
          currentTitle: 'Iron Lord',
          emblemURL:
            'https://www.bungie.net/common/destiny2_content/icons/f137072ea7289e44f3c798acfa3afc4b.jpg',
          emblemBackgroundURL:
            'https://www.bungie.net/common/destiny2_content/icons/45dd356bae55a76499ae0188cfedcb17.jpg',
          emblemColor: { red: 255, green: 24, blue: 17, alpha: 255 },
        },
        {
          id: '2305843009319907557',
          class: 'Hunter',
          race: 'Awoken',
          light: BigInt(545),
          currentTitle: '',
          emblemURL:
            'https://www.bungie.net/common/destiny2_content/icons/e9d7d8cfe2d079fc7ccc38b7df8fa537.jpg',
          emblemBackgroundURL:
            'https://www.bungie.net/common/destiny2_content/icons/5ab8eda6fedd55da2f3adf3aea557916.jpg',
          emblemColor: { red: 16, green: 5, blue: 42, alpha: 255 },
        },
      ],
    },
    {
      id: 'zUk4BWzsezGpYAs0TIzY',
      membershipId: '4611686018438658308',
      displayName: 'FunKing',
      characters: [
        {
          id: '2305843009277090551',
          class: 'Hunter',
          race: 'Human',
          light: BigInt(550),
          currentTitle: 'Godslayer',
          emblemURL:
            'https://www.bungie.net/common/destiny2_content/icons/38a24699b0de29be9bc57a19f8bc6d21.jpg',
          emblemBackgroundURL:
            'https://www.bungie.net/common/destiny2_content/icons/05eff9aeca6c7674b0071448359bce6a.jpg',
          emblemColor: { red: 0, green: 1, blue: 3, alpha: 255 },
        },
        {
          id: '2305843009555896843',
          class: 'Titan',
          race: 'Exo',
          light: BigInt(548),
          currentTitle: 'Swordbearer',
          emblemURL:
            'https://www.bungie.net/common/destiny2_content/icons/84330dd6892eb2d8b41d497ac4a240bf.jpg',
          emblemBackgroundURL:
            'https://www.bungie.net/common/destiny2_content/icons/1d57027dafd95bfef29e4fff890dcc15.jpg',
          emblemColor: { red: 31, green: 31, blue: 36, alpha: 255 },
        },
        {
          id: '2305843009277090552',
          class: 'Warlock',
          race: 'Awoken',
          light: BigInt(545),
          currentTitle: 'Flamekeeper',
          emblemURL:
            'https://www.bungie.net/common/destiny2_content/icons/d397f42b3859f31ba58a497e52704335.jpg',
          emblemBackgroundURL:
            'https://www.bungie.net/common/destiny2_content/icons/becc37f099968a886493ad99c982afd6.jpg',
          emblemColor: { red: 16, green: 13, blue: 13, alpha: 255 },
        },
      ],
    },
  ];
}

export function getDevMockFireteamMembers(
  scenario: DevFireteamMockScenario,
): FireteamMember[] {
  const now = new Date();
  const members = buildBaseMockMembers();

  if (scenario === 'all-inactive') {
    return members;
  }

  if (scenario === 'all-active') {
    return members.map((member, index) => ({
      ...member,
      activeSessions: [
        {
          sessionId:
            MOCK_SESSION_IDS_BY_USER[member.id] ?? `mock-session-${index + 1}`,
          characterId: member.characters[0].id,
          startedAt: subMinutes(now, (index + 1) * ALL_ACTIVE_STAGGER_MINUTES),
          trackComp: index === 0,
        },
      ],
    }));
  }

  return members.map((member, index) =>
    index === 0
      ? {
          ...member,
          activeSessions: [
            {
              sessionId: MOCK_SESSION_IDS_BY_USER[member.id],
              characterId: member.characters[0].id,
              startedAt: subMinutes(now, MIXED_ACTIVE_MINUTES_AGO),
              trackComp: true,
            },
          ],
        }
      : member,
  );
}

export function buildDevMockBulkStartResults(
  scenario: DevFireteamMockScenario,
  members: FireteamSessionMemberTarget[],
  trackComp: boolean,
): FireteamSessionResult[] {
  const now = new Date();

  return members.map((target, index) => {
    const isRaceSkipped = scenario === 'race' && index === 0;
    const isAllActiveSkipped = scenario === 'all-active';
    const outcome: FireteamSessionOutcome =
      isRaceSkipped || isAllActiveSkipped ? 'skipped_active' : 'started';

    return {
      userId: target.userId,
      characterId: target.characterId,
      outcome,
      session: {
        id:
          MOCK_SESSION_IDS_BY_USER[target.userId] ??
          `mock-started-${index + 1}`,
        userId: target.userId,
        characterId: target.characterId,
        startedAt: now,
        status: 'pending',
        name: getMockSessionName(outcome, trackComp),
        aggregateIds: outcome === 'skipped_active' ? ['mock-game-1'] : [],
        compTracking: trackComp
          ? {
              enabled: true,
              start: {
                divisionName: 'Adept II',
                points: 7640,
                stepIndex: 27,
              },
            }
          : undefined,
      },
    };
  });
}

export async function loadDevMockFireteam(request: Request): Promise<
  | {
      members: FireteamMember[];
      selectedCharacters?: Record<string, string>;
      devMockScenario: DevFireteamMockScenario;
    }
  | undefined
> {
  const url = new URL(request.url);
  const devMockScenario = parseDevFireteamMockScenario(
    url.searchParams.get('mock'),
  );
  if (!devMockScenario) return undefined;

  const prefs = await getPreferences(request);
  return {
    members: getDevMockFireteamMembers(devMockScenario),
    selectedCharacters: prefs.fireteam,
    devMockScenario,
  };
}

export function handleDevMockBulkStart(
  formData: FormData,
  members: FireteamSessionMemberTarget[],
  trackComp: boolean,
): FireteamSessionResult[] | undefined {
  const mockScenario = parseDevFireteamMockScenario(
    formData.get('mockScenario')?.toString(),
  );
  if (!mockScenario) return undefined;
  return buildDevMockBulkStartResults(mockScenario, members, trackComp);
}
