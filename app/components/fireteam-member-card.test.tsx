import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { FireteamMember } from '~/api';

import { FireteamMemberCard } from './fireteam-member-card';

const mockMember: FireteamMember = {
  id: 'user-10',
  membershipId: 'mem-10',
  displayName: 'TitanLeader',
  characters: [
    {
      id: 'char-titan',
      class: 'Titan',
      race: 'Awoken',
      light: BigInt(2020),
      emblemURL: '/logo.svg',
      emblemBackgroundURL: '/bg.svg',
      currentTitle: 'Iron Lord',
      emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
    },
  ],
};

describe('FireteamMemberCard', () => {
  it('renders member header and character picker', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <FireteamMemberCard member={mockMember} characterId="char-titan" />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('TitanLeader')).toBeInTheDocument();
    expect(screen.queryByText(/ID:/i)).not.toBeInTheDocument();
    expect(screen.getByText('Titan')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('Iron Lord')).toBeInTheDocument();
  });

  it('renders Active Session status and link to the live session without duplicate badges', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <FireteamMemberCard
            member={mockMember}
            characterId="char-titan"
            activeSessions={[
              {
                id: 'sess-active-99',
                userId: 'user-10',
                characterId: 'char-titan',
                status: 'pending',
                startedAt: new Date('2026-11-25T00:00:00Z'),
              },
            ]}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Active Session')).toBeInTheDocument();
    expect(screen.queryByText('Tracking')).not.toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view live session/i }),
    ).toHaveAttribute(
      'href',
      '/profile/user-10/c/char-titan/sessions/sess-active-99',
    );
    expect(
      screen.queryByRole('checkbox', { name: /include titanleader/i }),
    ).not.toBeInTheDocument();
  });

  it('renders bulk selection checkbox for inactive members and notifies onToggleBulkSelect', () => {
    const onToggleBulkSelect = vi.fn();

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <FireteamMemberCard
            member={mockMember}
            characterId="char-titan"
            isSelectedForBulk={true}
            onToggleBulkSelect={onToggleBulkSelect}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    const checkbox = screen.getByRole('checkbox', {
      name: /include titanleader in fireteam start/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(onToggleBulkSelect).toHaveBeenCalledWith(false);
  });
});
