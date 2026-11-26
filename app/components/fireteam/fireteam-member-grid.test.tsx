import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { FireteamMember } from '~/api';

import { FireteamProvider } from './fireteam-context';
import { FireteamMemberGrid } from './fireteam-member-grid';

vi.mock('~/hooks/use-route-loaders', () => ({
  useIsNavigating: () => [false],
}));

const members: FireteamMember[] = [
  {
    id: 'u1',
    membershipId: 'm1',
    displayName: 'ActiveHunter',
    characters: [
      {
        id: 'c1',
        class: 'Hunter',
        race: 'Human',
        light: BigInt(2020),
        currentTitle: '',
        emblemURL: '/e1.png',
        emblemBackgroundURL: '/b1.png',
        emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
      },
    ],
    activeSessions: [
      {
        sessionId: 'sess-1',
        characterId: 'c1',
        startedAt: new Date('2026-11-25T00:00:00Z'),
      },
    ],
  },
  {
    id: 'u2',
    membershipId: 'm2',
    displayName: 'ReadyTitan',
    characters: [
      {
        id: 'c2',
        class: 'Titan',
        race: 'Exo',
        light: BigInt(2020),
        currentTitle: '',
        emblemURL: '/e2.png',
        emblemBackgroundURL: '/b2.png',
        emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
      },
    ],
  },
];

describe('FireteamMemberGrid', () => {
  it('renders a composed member card for each fireteam member from FireteamProvider', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <FireteamProvider
            members={members}
            fireteamMemWithCharacters={{ u1: 'c1', u2: 'c2' }}
          >
            <FireteamMemberGrid />
          </FireteamProvider>
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('ActiveHunter')).toBeInTheDocument();
    expect(screen.getByText('ReadyTitan')).toBeInTheDocument();
    expect(screen.getByText('Active Session')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
