import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Profile, Session } from '~/api';

import { ActiveSessionCard } from './active-session-card';

const mockSession: Session = {
  id: 'sess-123',
  userId: 'user-456',
  characterId: 'char-789',
  name: 'Raid Night',
  description: 'Salvation Key Run',
  startedAt: new Date(),
  status: 'pending',
  aggregateIds: ['game-1', 'game-2', 'game-3'],
};

const mockProfile: Profile = {
  id: 'user-456',
  membershipId: 'mem-456',
  displayName: 'FireteamLeader',
  uniqueName: 'FireteamLeader#1111',
  characters: [],
};

describe('ActiveSessionCard', () => {
  it('renders session information and links to session page', () => {
    render(
      <MemoryRouter>
        <ActiveSessionCard session={mockSession} profile={mockProfile} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Raid Night')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('FireteamLeader')).toBeInTheDocument();
    expect(screen.getByText('Salvation Key Run')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute(
      'href',
      '/profile/user-456/c/char-789/sessions/sess-123',
    );
  });

  it('renders character class below session name and display name + title on emblem banner', () => {
    const profileWithCharacter: Profile = {
      ...mockProfile,
      characters: [
        {
          id: 'char-789',
          class: 'Hunter',
          race: 'Human',
          light: 2010n,
          emblemURL: '/logo.svg',
          emblemBackgroundURL: '/hero-landing.svg',
          currentTitle: 'Flawless',
          emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
        },
      ],
    };

    render(
      <MemoryRouter>
        <ActiveSessionCard
          session={mockSession}
          profile={profileWithCharacter}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('FireteamLeader')).toBeInTheDocument();
    expect(screen.getByText('Flawless')).toBeInTheDocument();
    expect(screen.getByText('Hunter')).toBeInTheDocument();
    expect(screen.getByText('2010')).toBeInTheDocument();
  });

  it('renders Competitive division and point delta when compTracking is enabled', () => {
    const compSession: Session = {
      ...mockSession,
      status: 'complete',
      compTracking: {
        enabled: true,
        start: {
          divisionName: 'Platinum II',
          points: 6910,
          stepIndex: 22,
        },
        end: {
          divisionName: 'Platinum I',
          points: 7135,
          stepIndex: 23,
        },
        pointDelta: 225,
      },
    };

    render(
      <MemoryRouter>
        <ActiveSessionCard session={compSession} profile={mockProfile} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Platinum I/)).toBeInTheDocument();
    expect(screen.getByText('(7,135)')).toBeInTheDocument();
    expect(screen.getByText('+225 pts')).toBeInTheDocument();
  });
});
