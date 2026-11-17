import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Profile, Session } from '~/api';

import {
  OverviewHeader,
  RecentFormPulse,
  computeRecentFormStats,
} from './overview-pulse';

const mockCharacter = {
  id: 'char-1',
  class: 'Hunter' as const,
  race: 'Human' as const,
  gender: 'Male' as const,
  light: 2000n,
  emblemURL: '/logo.svg',
  emblemBackgroundURL: '/hero-landing.svg',
  emblemColor: { red: 0, green: 0, blue: 0, alpha: 255 },
  currentTitle: 'Iron Lord',
};

const mockProfile: Profile = {
  id: 'user-1',
  displayName: 'Zone 6 Weegee',
  uniqueName: 'Zone 6 Weegee#1234',
  membershipId: '12345',
  characters: [mockCharacter],
};

describe('computeRecentFormStats', () => {
  it('computes aggregate matches, win rate, avg K/D, and latest K/D delta across sessions', () => {
    const sessions: Session[] = [
      {
        id: 's1',
        name: 'Latest Session',
        userId: 'user-1',
        characterId: 'char-1',
        startedAt: new Date('2026-11-15T10:00:00Z'),
        status: 'complete',
        aggregateIds: [],
        summary: {
          totalMatches: 6,
          wins: 4,
          losses: 2,
          kdRatio: 1.5,
        },
      },
      {
        id: 's2',
        name: 'Previous Session',
        userId: 'user-1',
        characterId: 'char-1',
        startedAt: new Date('2026-11-14T10:00:00Z'),
        status: 'complete',
        aggregateIds: [],
        summary: {
          totalMatches: 4,
          wins: 1,
          losses: 3,
          kdRatio: 1.0,
        },
      },
    ];

    const stats = computeRecentFormStats(sessions);
    expect(stats.sessionsCount).toBe(2);
    expect(stats.totalMatches).toBe(10);
    expect(stats.wins).toBe(5);
    expect(stats.losses).toBe(5);
    expect(stats.winRate).toBe(50);
    expect(stats.latestWinRateDelta).toBe(42);
    expect(stats.avgKd).toBe(1.3);
    expect(stats.latestKdDelta).toBe(0.5);
  });

  it('falls back to aggregateIds length when summary is missing', () => {
    const sessions: Session[] = [
      {
        id: 's1',
        userId: 'user-1',
        characterId: 'char-1',
        startedAt: new Date('2026-11-15T10:00:00Z'),
        status: 'pending',
        aggregateIds: ['a1', 'a2', 'a3'],
      },
    ];

    const stats = computeRecentFormStats(sessions);
    expect(stats.sessionsCount).toBe(1);
    expect(stats.totalMatches).toBe(3);
    expect(stats.winRate).toBeNull();
    expect(stats.latestWinRateDelta).toBeNull();
    expect(stats.avgKd).toBeNull();
    expect(stats.latestKdDelta).toBeNull();
  });
});

describe('OverviewHeader', () => {
  it('renders Start Session form and Fireteam link for idle owner', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <OverviewHeader
            profile={mockProfile}
            character={mockCharacter}
            isOwner={true}
            characterId="char-1"
            userId="user-1"
          />
        ),
      },
    ]);

    const { container } = render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { name: /welcome zone 6 weegee!/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /start session/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /fireteam/i })).toBeInTheDocument();

    const form = container.querySelector('form[action="/action/start-session"]');
    expect(form).toBeInTheDocument();
  });

  it('renders Open Live Session and Stop Session form when owner has an active session', () => {
    const activeSession: Session = {
      id: 'active-99',
      userId: 'user-1',
      characterId: 'char-1',
      startedAt: new Date('2026-11-15T12:00:00Z'),
      status: 'pending',
      aggregateIds: [],
    };

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <OverviewHeader
            profile={mockProfile}
            character={mockCharacter}
            isOwner={true}
            activeSession={activeSession}
            characterId="char-1"
            userId="user-1"
          />
        ),
      },
    ]);

    const { container } = render(<RouterProvider router={router} />);

    expect(screen.getByText(/live session active/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /open live session/i }),
    ).toHaveAttribute('href', '/sessions/active-99');
    expect(
      screen.getByRole('button', { name: /stop session/i }),
    ).toBeInTheDocument();

    const endForm = container.querySelector(
      'form[action="/action/end-session"]',
    );
    expect(endForm).toBeInTheDocument();
  });

  it('hides session mutation controls when viewing another player profile', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <OverviewHeader
            profile={mockProfile}
            character={mockCharacter}
            isOwner={false}
            characterId="char-1"
            userId="user-1"
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { name: /viewing zone 6 weegee!/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /start session/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /stop session/i }),
    ).not.toBeInTheDocument();
  });
});

describe('RecentFormPulse', () => {
  it('renders recent form summary with win rate and K/D trend deltas and Matches label', () => {
    const onSelectSession = vi.fn();
    const sessions: Session[] = [
      {
        id: 's1',
        name: 'Current Run',
        userId: 'user-1',
        characterId: 'char-1',
        startedAt: new Date('2026-11-15T10:00:00Z'),
        status: 'complete',
        aggregateIds: [],
        summary: {
          totalMatches: 6,
          wins: 4,
          losses: 2,
          kdRatio: 1.4,
        },
      },
      {
        id: 's2',
        name: 'Iron Banner Night',
        userId: 'user-1',
        characterId: 'char-1',
        startedAt: new Date('2026-11-14T10:00:00Z'),
        status: 'complete',
        aggregateIds: [],
        summary: {
          totalMatches: 4,
          wins: 2,
          losses: 2,
          kdRatio: 1.1,
        },
      },
    ];

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <RecentFormPulse
            sessions={sessions}
            onSelectSession={onSelectSession}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/recent form \(2 sessions\)/i)).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText(/\+17% latest/i)).toBeInTheDocument();
    expect(screen.getByText(/\+0\.30 latest/i)).toBeInTheDocument();
    expect(screen.getByText(/4 matches/i)).toBeInTheDocument();

    const prevPill = screen.getByRole('button', {
      name: /iron banner night/i,
    });
    fireEvent.click(prevPill);
    expect(onSelectSession).toHaveBeenCalledWith('s2');
  });
});

