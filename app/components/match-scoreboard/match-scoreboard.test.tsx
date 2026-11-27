import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ActivityHistory,
  ActivityParticipant,
  CharacterSnapshot,
  Team,
} from '~/api';
import { buildMatchScoreboardViewModel } from '~/lib/match-scoreboard';

import { ActivityMeta, MatchScoreboard } from './index';

vi.mock('~/charts/ClassStats', () => ({
  ClassStats: ({ data }: { data: { stat: string; value: number }[] }) => (
    <div data-testid="class-stats">
      {data.map((item) => `${item.stat}:${item.value}`).join(',')}
    </div>
  ),
}));

function makeTrackedSnapshot(): CharacterSnapshot {
  return {
    id: 'snap-1',
    name: 'Nightstalker Loadout',
    userId: 'user-1',
    characterId: 'char-tracked',
    createdAt: new Date('2026-11-26T00:00:00Z'),
    updatedAt: new Date('2026-11-26T00:00:00Z'),
    hash: 'hash-1',
    stats: {
      Mobility: {
        name: 'Mobility',
        description: 'Increases movement speed',
        value: 100,
        icon: '',
        hasIcon: false,
        statCategory: 0,
        aggregationType: 0,
      },
      Recovery: {
        name: 'Recovery',
        description: 'Increases health recovery',
        value: 100,
        icon: '',
        hasIcon: false,
        statCategory: 0,
        aggregationType: 0,
      },
      Power: {
        name: 'Power',
        description: 'Light level',
        value: 547,
        icon: '',
        hasIcon: false,
        statCategory: 0,
        aggregationType: 0,
      },
    },
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
          sockets: [
            {
              plugHash: 1001,
              name: 'Spectral Blades',
              description: 'Void Super',
              icon: '/common/super.png',
              itemTypeDisplayName: 'Super Ability',
              isVisible: true,
              isEnabled: true,
            },
            {
              plugHash: 1002,
              name: 'Vanishing Step',
              description: 'Dodge to go invisible',
              icon: '/common/aspect.png',
              itemTypeDisplayName: 'Void Aspect',
              isVisible: true,
              isEnabled: true,
            },
            {
              plugHash: 1003,
              name: 'Echo of Leeching',
              description: 'Melee final blows start health regen',
              icon: '/common/fragment.png',
              itemTypeDisplayName: 'Void Fragment',
              isVisible: true,
              isEnabled: true,
            },
          ],
        },
      },
    },
  };
}

const TEAMS: Team[] = [
  { id: '19', teamName: '19', score: '35', standing: 'Victory' },
  { id: '20', teamName: '20', score: '12', standing: 'Defeat' },
];

const LOADOUT_PARTICIPANT: ActivityParticipant = {
  characterId: 'char-tracked',
  membershipId: 'mem-1',
  membershipType: 1,
  displayName: 'Zone 6 Weegee',
  displayNameCode: '9629',
  characterClass: 'Hunter',
  lightLevel: 547,
  emblemIconUrl: 'https://www.bungie.net/common/emblem-1.jpg',
  teamId: '19',
  standing: 0,
  score: { value: 19, displayValue: '19' },
  completed: true,
  fireteamId: 'ft-alpha-stack',
  userId: 'user-1',
  sessionId: 'sess-1',
  snapshotId: 'snap-1',
  confidenceLevel: 'high',
  performance: {
    playerStats: {
      kills: { value: 15, displayValue: '15' },
      deaths: { value: 3, displayValue: '3' },
      assists: { value: 4, displayValue: '4' },
      kd: { value: 5, displayValue: '5.00' },
      kda: { value: 5.67, displayValue: '5.67' },
    },
    weapons: {
      '1617917863': {
        referenceId: BigInt(1617917863),
        bucketHash: BigInt(1498876634),
        itemTypeDisplayName: 'Hand Cannon',
        display: {
          name: "Crimil's Dagger",
          description: 'Legendary Hand Cannon',
          icon: 'https://www.bungie.net/common/crimils.jpg',
          hasIcon: true,
        },
        properties: {
          baseInfo: {
            itemHash: BigInt(1617917863),
            instanceId: 'inst-1',
            name: "Crimil's Dagger",
            icon: '/common/crimils.jpg',
            itemTypeDisplayName: 'Hand Cannon',
            itemTypeAndTierDisplayName: 'Legendary Hand Cannon',
            tierTypeName: 'Legendary',
            tierType: 5,
            bucketHash: BigInt(1498876634),
          },
          perks: [],
          stats: {},
          sockets: [],
        },
        stats: {
          uniqueWeaponKills: { basic: { value: 6, displayValue: '6' } },
          uniqueWeaponPrecisionKills: {
            basic: { value: 4, displayValue: '4' },
          },
          uniqueWeaponKillsPrecisionKills: {
            basic: { value: 0.67, displayValue: '67%' },
          },
        },
      },
    },
  },
};

const SESSION_ONLY_PARTICIPANT: ActivityParticipant = {
  characterId: 'char-session-only',
  membershipId: 'mem-2',
  membershipType: 1,
  displayName: 'TeammateNoSnap',
  displayNameCode: '4422',
  characterClass: 'Titan',
  lightLevel: 540,
  emblemIconUrl: 'https://www.bungie.net/common/emblem-2.jpg',
  teamId: '19',
  standing: 0,
  score: { value: 11, displayValue: '11' },
  completed: true,
  fireteamId: 'ft-alpha-stack',
  userId: 'user-2',
  sessionId: 'sess-2',
  confidenceLevel: 'noMatch',
  performance: {
    playerStats: {
      kills: { value: 9, displayValue: '9' },
      deaths: { value: 5, displayValue: '5' },
      assists: { value: 2, displayValue: '2' },
      kd: { value: 1.8, displayValue: '1.80' },
      kda: { value: 2.2, displayValue: '2.20' },
    },
    weapons: {
      '3844694310': {
        referenceId: BigInt(3844694310),
        bucketHash: BigInt(1498876634),
        itemTypeDisplayName: 'Scout Rifle',
        display: {
          name: 'The Jade Rabbit',
          description: 'Exotic Scout Rifle',
          icon: 'https://www.bungie.net/common/jade.jpg',
          hasIcon: true,
        },
        stats: {
          uniqueWeaponKills: { basic: { value: 7, displayValue: '7' } },
          uniqueWeaponPrecisionKills: {
            basic: { value: 5, displayValue: '5' },
          },
        },
      },
    },
  },
};

const UNTRACKED_PARTICIPANT: ActivityParticipant = {
  characterId: 'char-untracked',
  membershipId: 'mem-3',
  membershipType: 3,
  displayName: 'OpponentOne',
  displayNameCode: '1111',
  characterClass: 'Warlock',
  lightLevel: 520,
  emblemIconUrl: 'https://www.bungie.net/common/emblem-3.jpg',
  teamId: '20',
  standing: 1,
  score: { value: 5, displayValue: '5' },
  completed: false,
  userId: 'user-registered-only',
  performance: {
    playerStats: {
      kills: { value: 4, displayValue: '4' },
      deaths: { value: 8, displayValue: '8' },
      assists: { value: 1, displayValue: '1' },
      kd: { value: 0.5, displayValue: '0.50' },
      kda: { value: 0.63, displayValue: '0.63' },
    },
    weapons: {
      '1253087083': {
        referenceId: BigInt(1253087083),
        bucketHash: BigInt(2465295065),
        itemTypeDisplayName: 'Sniper Rifle',
        display: {
          name: 'IKELOS_SR_v1.0.2',
          description: 'Legendary Sniper Rifle',
          icon: 'https://www.bungie.net/common/ikelos.jpg',
          hasIcon: true,
        },
        stats: {
          uniqueWeaponKills: { basic: { value: 3, displayValue: '3' } },
        },
      },
    },
  },
};

describe('MatchScoreboard', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('renders Alpha and Bravo team sections, vertical FT bars without FT/tracked pills, and subclass preview for loadout-tracked players', () => {
    const viewModel = buildMatchScoreboardViewModel({
      participants: [
        LOADOUT_PARTICIPANT,
        SESSION_ONLY_PARTICIPANT,
        UNTRACKED_PARTICIPANT,
      ],
      teams: TEAMS,
      snapshots: { 'char-tracked': makeTrackedSnapshot() },
    });

    render(
      <MemoryRouter>
        <MatchScoreboard viewModel={viewModel} />
      </MemoryRouter>,
    );

    const alphaSection = screen.getByRole('region', { name: 'Alpha roster' });
    const bravoSection = screen.getByRole('region', { name: 'Bravo roster' });

    expect(within(alphaSection).getByText('Alpha')).toBeInTheDocument();
    expect(within(alphaSection).getByText('Victory')).toBeInTheDocument();
    expect(within(alphaSection).getByText('35')).toBeInTheDocument();
    expect(within(alphaSection).getByText('Zone 6 Weegee')).toBeInTheDocument();
    expect(within(alphaSection).getByText('#9629')).toBeInTheDocument();
    expect(within(alphaSection).queryByText('Viewing')).not.toBeInTheDocument();
    expect(
      within(alphaSection).queryByText('Loadout Tracked'),
    ).not.toBeInTheDocument();
    expect(
      within(alphaSection).queryByText('Session Tracked'),
    ).not.toBeInTheDocument();
    expect(within(alphaSection).queryByText('FT 1')).not.toBeInTheDocument();
    expect(
      within(alphaSection).getByText(/Nightstalker · 547/),
    ).toBeInTheDocument();
    expect(within(alphaSection).getAllByTestId('fireteam-bar-1')).toHaveLength(
      2,
    );
    expect(
      within(alphaSection).getAllByTestId('fireteam-bar-1')[0],
    ).toBeEmptyDOMElement();

    expect(within(bravoSection).getByText('Bravo')).toBeInTheDocument();
    expect(within(bravoSection).getByText('Defeat')).toBeInTheDocument();
    expect(within(bravoSection).getByText('12')).toBeInTheDocument();
    expect(within(bravoSection).getByText('Left')).toBeInTheDocument();

    const leftRow = within(bravoSection)
      .getByText('OpponentOne')
      .closest('[data-left-early="true"]');
    expect(leftRow).toHaveClass('opacity-50');

    const registeredProfileLink = within(bravoSection).getByRole('link', {
      name: 'OpponentOne',
    });
    expect(registeredProfileLink).toHaveAttribute(
      'href',
      '/profile/user-registered-only',
    );
    expect(
      within(bravoSection).queryByRole('button', { name: /inspect/i }),
    ).not.toBeInTheDocument();
  });

  it('opens the responsive loadout sheet when clicking a tracked row, with sticky footer links and multi-player switcher', () => {
    const viewModel = buildMatchScoreboardViewModel({
      participants: [
        LOADOUT_PARTICIPANT,
        SESSION_ONLY_PARTICIPANT,
        UNTRACKED_PARTICIPANT,
      ],
      teams: TEAMS,
      snapshots: { 'char-tracked': makeTrackedSnapshot() },
    });

    render(
      <MemoryRouter>
        <MatchScoreboard viewModel={viewModel} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Nightstalker · 547/));

    const sheet = screen.getByRole('dialog');
    expect(
      within(sheet).getByRole('link', { name: /view session/i }),
    ).toHaveAttribute('href', '/profile/user-1/c/char-tracked/sessions/sess-1');
    expect(
      within(sheet).getByRole('link', { name: /view loadout/i }),
    ).toHaveAttribute('href', '/profile/user-1/c/char-tracked/loadouts/snap-1');
    expect(within(sheet).getByText('Nightstalker')).toBeInTheDocument();
    expect(within(sheet).getByTestId('class-stats')).toHaveTextContent(
      'Mobility:100,Recovery:100',
    );
    expect(within(sheet).getByTestId('class-stats')).not.toHaveTextContent(
      'Power',
    );
    expect(within(sheet).getByText("Crimil's Dagger")).toBeInTheDocument();

    const teammateTab = within(sheet).getByRole('tab', {
      name: /TeammateNoSnap/i,
    });
    fireEvent.mouseDown(teammateTab, { button: 0, ctrlKey: false });
    fireEvent.click(teammateTab);

    expect(teammateTab).toHaveAttribute('aria-selected', 'true');
    expect(
      within(sheet).getByRole('link', { name: /view session/i }),
    ).toHaveAttribute(
      'href',
      '/profile/user-2/c/char-session-only/sessions/sess-2',
    );
    expect(
      within(sheet).queryByRole('link', { name: /view loadout/i }),
    ).not.toBeInTheDocument();
    expect(within(sheet).getByText('The Jade Rabbit')).toBeInTheDocument();
  });

  it('closes the loadout sheet cleanly without emitting DialogTitle console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const viewModel = buildMatchScoreboardViewModel({
        participants: [LOADOUT_PARTICIPANT, UNTRACKED_PARTICIPANT],
        teams: TEAMS,
        snapshots: { 'char-tracked': makeTrackedSnapshot() },
      });

      render(
        <MemoryRouter>
          <MatchScoreboard viewModel={viewModel} />
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByText(/Nightstalker · 547/));
      const sheet = screen.getByRole('dialog');
      expect(within(sheet).getByText('Zone 6 Weegee')).toBeInTheDocument();

      fireEvent.click(within(sheet).getByRole('button', { name: /close/i }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('opens the sheet for a session-only (noMatch) player to show View Session, notice, and PGCR weapon metrics', () => {
    const viewModel = buildMatchScoreboardViewModel({
      participants: [SESSION_ONLY_PARTICIPANT, UNTRACKED_PARTICIPANT],
      teams: TEAMS,
      snapshots: {},
    });

    render(
      <MemoryRouter>
        <MatchScoreboard viewModel={viewModel} />
      </MemoryRouter>,
    );

    const inspectButton = screen.getByRole('button', {
      name: 'Inspect session details for TeammateNoSnap',
    });
    fireEvent.click(inspectButton);

    const sheet = screen.getByRole('dialog');
    expect(
      within(sheet).getByRole('link', { name: /view session/i }),
    ).toHaveAttribute(
      'href',
      '/profile/user-2/c/char-session-only/sessions/sess-2',
    );
    expect(
      within(sheet).queryByRole('link', { name: /view loadout/i }),
    ).not.toBeInTheDocument();
    expect(
      within(sheet).getByText(
        /no loadout snapshot was matched for this activity/i,
      ),
    ).toBeInTheDocument();
    expect(within(sheet).getByText('The Jade Rabbit')).toBeInTheDocument();
    expect(within(sheet).getByText('Scout Rifle')).toBeInTheDocument();
  });

  it('renders a single Standings section in FFA / Rumble fallback mode', () => {
    const ffaParticipants: ActivityParticipant[] = [
      { ...UNTRACKED_PARTICIPANT, teamId: undefined, standing: 1 },
      {
        ...LOADOUT_PARTICIPANT,
        teamId: undefined,
        standing: 0,
      },
    ];
    const viewModel = buildMatchScoreboardViewModel({
      participants: ffaParticipants,
      teams: [],
      snapshots: { 'char-tracked': makeTrackedSnapshot() },
    });

    render(
      <MemoryRouter>
        <MatchScoreboard viewModel={viewModel} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('region', { name: 'Standings roster' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Alpha roster' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Zone 6 Weegee')).toBeInTheDocument();
    expect(screen.getByText('OpponentOne')).toBeInTheDocument();
  });

  it('renders matching left-side vertical FT bars for teammates in the same stack and none for solo players', () => {
    const secondStackMemberOne: ActivityParticipant = {
      ...UNTRACKED_PARTICIPANT,
      characterId: 'char-ft2-a',
      displayName: 'DuoMemberA',
      teamId: '19',
      fireteamId: 'ft-alpha-second-stack',
      score: { value: 8, displayValue: '8' },
    };
    const secondStackMemberTwo: ActivityParticipant = {
      ...UNTRACKED_PARTICIPANT,
      characterId: 'char-ft2-b',
      displayName: 'DuoMemberB',
      teamId: '19',
      fireteamId: 'ft-alpha-second-stack',
      score: { value: 7, displayValue: '7' },
    };

    const viewModel = buildMatchScoreboardViewModel({
      participants: [
        LOADOUT_PARTICIPANT,
        SESSION_ONLY_PARTICIPANT,
        secondStackMemberOne,
        secondStackMemberTwo,
        UNTRACKED_PARTICIPANT,
      ],
      teams: TEAMS,
      snapshots: { 'char-tracked': makeTrackedSnapshot() },
    });

    render(
      <MemoryRouter>
        <MatchScoreboard viewModel={viewModel} />
      </MemoryRouter>,
    );

    const alphaSection = screen.getByRole('region', { name: 'Alpha roster' });
    const bravoSection = screen.getByRole('region', { name: 'Bravo roster' });

    const fireteamOneBars =
      within(alphaSection).getAllByTestId('fireteam-bar-1');
    const fireteamTwoBars =
      within(alphaSection).getAllByTestId('fireteam-bar-2');

    expect(fireteamOneBars).toHaveLength(2);
    expect(fireteamTwoBars).toHaveLength(2);
    expect(fireteamOneBars[0]).toBeEmptyDOMElement();
    expect(fireteamTwoBars[0]).toBeEmptyDOMElement();
    expect(fireteamOneBars[0].className).toBe(fireteamOneBars[1].className);
    expect(fireteamTwoBars[0].className).toBe(fireteamTwoBars[1].className);
    expect(fireteamOneBars[0].className).not.toBe(fireteamTwoBars[0].className);
    expect(
      within(bravoSection).queryByTestId(/fireteam-bar-/),
    ).not.toBeInTheDocument();
  });
});

describe('ActivityMeta', () => {
  it('renders dynamic 1 Trick title and OpenGraph/canonical tags', () => {
    const activity: ActivityHistory = {
      instanceId: '17183272072',
      location: 'Eternity',
      activity: 'Control',
      description: 'Crucible match',
      mode: 'Clash Quickplay',
      period: new Date('2026-11-26T00:00:00Z'),
      referenceId: BigInt(1),
      activityHash: BigInt(2),
      imageUrl: '/img/map.jpg',
      activityIcon: '/img/icon.png',
    };

    render(
      <ActivityMeta
        activity={activity}
        userId="user-1"
        characterId="char-1"
        instanceId="17183272072"
      />,
    );

    expect(document.title).toBe(
      'Eternity - Control • Clash Quickplay | 1 Trick',
    );
  });
});
