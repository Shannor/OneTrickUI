import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
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
    expect(screen.getByText('Titan')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('Iron Lord')).toBeInTheDocument();
  });
});
