import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { SearchUserResult } from '~/api';

import {
  RecordedPlayerResult,
  SearchResultItem,
  UnrecordedPlayerResult,
  splitBungieName,
} from './search-result-item';

const recordedResult: SearchUserResult = {
  isRecorded: true,
  userId: 'TTXWDT9pzDEA0XiO1iAc',
  bungieNetMembershipId: '123456',
  primaryMembershipId: '4611686018467890123',
  primaryMembershipType: 3n,
  displayName: 'Zone 6 Weegee',
  uniqueName: 'Zone 6 Weegee#1234',
  iconPath: '/common/destiny2_content/icons/emblem.jpg',
  alternateNames: ['WeegeeSteam', 'WeegeePSN'],
  characters: [
    {
      id: '2305843009261519028',
      light: 2010n,
      emblemURL: '/common/destiny2_content/icons/hunter.jpg',
      emblemBackgroundURL: '/common/destiny2_content/icons/bg.jpg',
      currentTitle: 'Flawless',
      emblemColor: { red: 10, green: 20, blue: 30, alpha: 255 },
      race: 'Human',
      class: 'Hunter',
    },
    {
      id: '2305843009261519029',
      light: 2005n,
      emblemURL: '/common/destiny2_content/icons/warlock.jpg',
      emblemBackgroundURL: '/common/destiny2_content/icons/bg2.jpg',
      currentTitle: 'Glorious',
      emblemColor: { red: 10, green: 20, blue: 30, alpha: 255 },
      race: 'Awoken',
      class: 'Warlock',
    },
  ],
};

const unrecordedResult: SearchUserResult = {
  isRecorded: false,
  bungieNetMembershipId: '998877',
  primaryMembershipId: '4611686018499999999',
  primaryMembershipType: 1n,
  displayName: 'UnrecordedGuardian',
  uniqueName: 'UnrecordedGuardian#5678',
  alternateNames: ['GuardianXbox'],
};

const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

describe('splitBungieName', () => {
  it('splits Bungie name and discriminator', () => {
    expect(splitBungieName('Guardian#1234')).toEqual({
      baseName: 'Guardian',
      discriminator: '#1234',
    });
  });

  it('returns base name only when no discriminator exists', () => {
    expect(splitBungieName('Guardian')).toEqual({ baseName: 'Guardian' });
  });
});

describe('RecordedPlayerResult', () => {
  it('renders Recorded badge, character quick-links, alternate names, and View Profile link', () => {
    render(
      <MemoryRouter>
        <RecordedPlayerResult result={recordedResult} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Zone 6 Weegee')).toBeInTheDocument();
    expect(screen.getByText('#1234')).toBeInTheDocument();
    expect(screen.getByText('Recorded on 1 Trick')).toBeInTheDocument();
    expect(screen.getByText('WeegeeSteam')).toBeInTheDocument();
    expect(screen.getByText('WeegeePSN')).toBeInTheDocument();

    const viewProfileLink = screen.getByRole('link', { name: /view profile/i });
    expect(viewProfileLink).toHaveAttribute(
      'href',
      '/profile/TTXWDT9pzDEA0XiO1iAc',
    );

    const hunterLink = screen.getByRole('link', { name: /hunter/i });
    expect(hunterLink).toHaveAttribute(
      'href',
      '/profile/TTXWDT9pzDEA0XiO1iAc/c/2305843009261519028',
    );
    expect(screen.getByText('2010')).toBeInTheDocument();

    const warlockLink = screen.getByRole('link', { name: /warlock/i });
    expect(warlockLink).toHaveAttribute(
      'href',
      '/profile/TTXWDT9pzDEA0XiO1iAc/c/2305843009261519029',
    );
  });
});

describe('UnrecordedPlayerResult', () => {
  it('renders explanatory note and CTAs for signed-out viewer with zero profile links and zero emojis', () => {
    const { container } = render(
      <MemoryRouter>
        <UnrecordedPlayerResult result={unrecordedResult} isSignedIn={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Not Recorded')).toBeInTheDocument();
    expect(
      screen.getByText(
        /1 trick only supports profiles for guardians who have recorded/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/is this you\? sign in with bungie to start recording/i),
    ).toBeInTheDocument();

    const startRecordingLink = screen.getByRole('link', {
      name: /start recording/i,
    });
    expect(startRecordingLink).toHaveAttribute('href', '/login');
    expect(
      screen.getByRole('button', { name: /share 1 trick/i }),
    ).toBeInTheDocument();

    const allLinks = screen.getAllByRole('link');
    for (const link of allLinks) {
      expect(link.getAttribute('href')).not.toMatch(/^\/profile\//);
    }

    expect(container.textContent).not.toMatch(EMOJI_PATTERN);
  });

  it('renders explanatory note and Share 1 Trick CTA without /login for signed-in viewer', () => {
    const { container } = render(
      <MemoryRouter>
        <UnrecordedPlayerResult result={unrecordedResult} isSignedIn={true} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Not Recorded')).toBeInTheDocument();
    expect(
      screen.getByText(/share 1 trick to invite them/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /share 1 trick/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /start recording/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);

    expect(container.textContent).not.toMatch(EMOJI_PATTERN);
  });

  it('filters out alternate names that duplicate displayName while keeping distinct ones', () => {
    render(
      <MemoryRouter>
        <UnrecordedPlayerResult
          result={{
            ...unrecordedResult,
            displayName: 'Zone',
            uniqueName: 'Zone#0117',
            alternateNames: ['Zone', 'zone', 'DistinctAlt'],
          }}
          isSignedIn={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('DistinctAlt')).toBeInTheDocument();
    expect(screen.queryByText('zone')).not.toBeInTheDocument();
  });
});

describe('SearchResultItem', () => {
  it('renders RecordedPlayerResult when isRecorded is true and userId is present', () => {
    render(
      <MemoryRouter>
        <SearchResultItem result={recordedResult} isSignedIn={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Recorded on 1 Trick')).toBeInTheDocument();
  });

  it('falls back to UnrecordedPlayerResult when userId is missing even if isRecorded is true', () => {
    render(
      <MemoryRouter>
        <SearchResultItem
          result={{ ...recordedResult, userId: undefined }}
          isSignedIn={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Not Recorded')).toBeInTheDocument();
  });
});
