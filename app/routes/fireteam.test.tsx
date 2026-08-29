import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { FireteamMember } from '~/api';

import Fireteam from './fireteam';

vi.mock('~/hooks/use-route-loaders', () => ({
  useIsNavigating: () => [false],
}));

const mockMembers: FireteamMember[] = [
  {
    id: 'user-1',
    membershipId: 'mem-1',
    displayName: 'HunterGuardian',
    characters: [
      {
        id: 'char-hunter',
        class: 'Hunter',
        race: 'Awoken',
        light: BigInt(2020),
        emblemURL: '/logo.svg',
        emblemBackgroundURL: '/bg.svg',
        currentTitle: 'Flawless',
        emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
      },
    ],
  },
];

describe('Fireteam Route Component', () => {
  it('renders offline empty state when member list is empty', () => {
    const props = {
      loaderData: {
        members: [],
        sessions: [],
        fireteamMemWithCharacters: {},
      },
    } as unknown as ComponentProps<typeof Fireteam>;

    const router = createMemoryRouter(
      [
        {
          path: '/fireteam',
          element: <Fireteam {...props} />,
        },
      ],
      {
        initialEntries: ['/fireteam'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('You are currently offline.')).toBeInTheDocument();
  });

  it('renders fireteam header and member cards when members exist', () => {
    const props = {
      loaderData: {
        members: mockMembers,
        sessions: [],
        fireteamMemWithCharacters: {
          'user-1': 'char-hunter',
        },
      },
    } as unknown as ComponentProps<typeof Fireteam>;

    const router = createMemoryRouter(
      [
        {
          path: '/fireteam',
          element: <Fireteam {...props} />,
        },
      ],
      {
        initialEntries: ['/fireteam'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Fireteam Overview')).toBeInTheDocument();
    expect(screen.getByText('1 Teammate')).toBeInTheDocument();
    expect(screen.getByText('HunterGuardian')).toBeInTheDocument();
    expect(screen.getByText('Hunter')).toBeInTheDocument();
  });
});
