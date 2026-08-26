import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { User } from '~/api';

import { PlayerCard } from './player-card';

// Polyfill ResizeObserver for Recharts ClassStats component in JSDOM environment
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

describe('PlayerCard', () => {
  const mockUser: User = {
    id: 'user-123',
    displayName: 'GuardianOne',
    memberId: 'mem-123',
    primaryMembershipId: 'pmem-123',
    uniqueName: 'GuardianOne#1234',
    memberships: [],
    characterIds: ['char-1'],
    createdAt: new Date(),
  };

  const mockPerformance = {
    playerStats: {
      kills: { value: 15 },
      assists: { value: 5 },
      deaths: { value: 10 },
      standing: { value: 0 },
    },
    weapons: {},
  };

  it('renders player display name and stats', () => {
    render(
      <MemoryRouter>
        <PlayerCard user={mockUser} performance={mockPerformance} />
      </MemoryRouter>,
    );

    expect(screen.getByText('GuardianOne')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // kills
    expect(screen.getByText('5')).toBeInTheDocument(); // assists
    expect(screen.getByText('10')).toBeInTheDocument(); // deaths
    expect(screen.getByText('1.50')).toBeInTheDocument(); // K/D
  });

  it('renders "View Session" and "View Loadout" buttons when action props are provided', () => {
    render(
      <MemoryRouter>
        <PlayerCard
          user={mockUser}
          performance={mockPerformance}
          characterId="char-1"
          sessionId="sess-1"
          snapshotId="snap-1"
        />
      </MemoryRouter>,
    );

    const sessionLink = screen.getByRole('link', { name: /view session/i });
    expect(sessionLink).toBeInTheDocument();
    expect(sessionLink).toHaveAttribute(
      'href',
      '/profile/user-123/c/char-1/sessions/sess-1',
    );

    const loadoutLink = screen.getByRole('link', { name: /view loadout/i });
    expect(loadoutLink).toBeInTheDocument();
    expect(loadoutLink).toHaveAttribute(
      'href',
      '/profile/user-123/c/char-1/loadouts/snap-1',
    );
  });
});
