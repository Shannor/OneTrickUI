import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { CharacterSnapshot } from '~/api';

import { Loadouts } from './loadouts';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => ({
    type: 'owner',
    profile: {
      id: 'user-1',
      displayName: 'TestGuardian',
    },
    character: { id: 'char-1', class: 'Hunter' },
  }),
}));

describe('Loadouts Route Component', () => {
  const olderSnapshot: CharacterSnapshot = {
    id: 'snap-1',
    name: 'Older Loadout',
    description: 'First loadout',
    userId: 'user-1',
    characterId: 'char-1',
    hash: 'hash-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    loadout: {},
  };

  const newerSnapshot: CharacterSnapshot = {
    id: 'snap-2',
    name: 'Newer Loadout',
    description: 'Second loadout',
    userId: 'user-1',
    characterId: 'char-1',
    hash: 'hash-2',
    createdAt: new Date('2024-06-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z'),
    loadout: {},
  };

  it('renders loadouts in chronological order (newest first)', () => {
    const props = {
      loaderData: {
        loadouts: {
          items: [olderSnapshot, newerSnapshot],
          count: { 'snap-1': 5, 'snap-2': 10 },
          stats: {},
        },
        gameMode: 'allGameModes' as const,
        minimumGames: 5,
        page: 1,
      },
    } as unknown as ComponentProps<typeof Loadouts>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Loadouts {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: "TestGuardian's Loadouts",
      }),
    ).toBeInTheDocument();

    const names = screen
      .getAllByRole('heading', { level: 3 })
      .map((el) => el.textContent);
    expect(names[0]).toBe('Newer Loadout');
    expect(names[1]).toBe('Older Loadout');
  });

  it('renders minimum games note for viewing all loadouts', () => {
    const props = {
      loaderData: {
        loadouts: {
          items: [],
          count: {},
          stats: {},
        },
        gameMode: 'allGameModes' as const,
        minimumGames: 5,
        page: 1,
      },
    } as unknown as ComponentProps<typeof Loadouts>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Loadouts {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByText('Set to 0 to view all loadouts.'),
    ).toBeInTheDocument();
  });

  it('renders pagination controls when there are full page items', () => {
    const tenSnapshots = Array.from({ length: 10 }, (_, i) => ({
      ...olderSnapshot,
      id: `snap-${i}`,
      name: `Loadout ${i}`,
    }));

    const props = {
      loaderData: {
        loadouts: {
          items: tenSnapshots,
          count: {},
          stats: {},
        },
        gameMode: 'allGameModes' as const,
        minimumGames: 5,
        page: 1,
      },
    } as unknown as ComponentProps<typeof Loadouts>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Loadouts {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('link', { name: /next/i })).toBeInTheDocument();
  });

  it('renders empty state when there are no loadouts', () => {
    const props = {
      loaderData: {
        loadouts: {
          items: [],
          count: {},
          stats: {},
        },
        gameMode: 'allGameModes' as const,
        minimumGames: 5,
        page: 1,
      },
    } as unknown as ComponentProps<typeof Loadouts>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Loadouts {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Get in the Crucible!')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Play more games so your loadouts will start showing up!',
      ),
    ).toBeInTheDocument();
  });
});
