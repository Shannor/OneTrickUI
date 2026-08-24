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
});
