import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type CharacterSnapshot, getSnapshots } from '~/api';

import { Loadouts, loader } from './loadouts';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

const mockUseProfileData = vi.fn();
const mockUseNavigationState = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => mockUseProfileData(),
  useNavigationState: () => mockUseNavigationState(),
}));

vi.mock('~/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api')>();
  return {
    ...actual,
    getSnapshots: vi.fn(),
    getSimilarSnapshots: vi.fn(),
  };
});

describe('Loadouts Route Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileData.mockReturnValue({
      type: 'owner',
      profile: {
        id: 'user-1',
        displayName: 'TestGuardian',
      },
      character: { id: 'char-1', class: 'Hunter' },
    });
    mockUseNavigationState.mockReturnValue({
      scope: 'idle',
      isNavigating: false,
      isCrossRoute: false,
      isSameRoute: false,
      isSubTab: false,
      isScopedPending: false,
      nextLocation: undefined,
    });
  });

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

  it('renders "Has Similar Loadouts" filter and "X Similar" card badges when type === "owner"', () => {
    const props = {
      loaderData: {
        loadouts: {
          items: [olderSnapshot, newerSnapshot],
          count: { 'snap-1': 5, 'snap-2': 10 },
          stats: {},
          similarCounts: { 'snap-1': 3, 'snap-2': 0 },
        },
        gameMode: 'allGameModes' as const,
        minimumGames: 5,
        hasSimilar: false,
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
      screen.getByRole('button', { name: /has similar loadouts/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /3 similar/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /0 similar/i }),
    ).not.toBeInTheDocument();
  });

  it('hides "Has Similar Loadouts" filter and "X Similar" badges when type !== "owner"', () => {
    mockUseProfileData.mockReturnValue({
      type: 'public',
      profile: {
        id: 'user-1',
        displayName: 'TestGuardian',
      },
      character: { id: 'char-1', class: 'Hunter' },
    });

    const props = {
      loaderData: {
        loadouts: {
          items: [olderSnapshot, newerSnapshot],
          count: { 'snap-1': 5, 'snap-2': 10 },
          stats: {},
          similarCounts: { 'snap-1': 3, 'snap-2': 2 },
        },
        gameMode: 'allGameModes' as const,
        minimumGames: 5,
        hasSimilar: false,
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
      screen.queryByRole('button', { name: /has similar loadouts/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /3 similar/i }),
    ).not.toBeInTheDocument();
  });

  it('updates URL query params (?hasSimilar=true and resets page) when toggling Has Similar filter', () => {
    const props = {
      loaderData: {
        loadouts: {
          items: [olderSnapshot],
          count: { 'snap-1': 5 },
          stats: {},
          similarCounts: { 'snap-1': 2 },
        },
        gameMode: 'allGameModes' as const,
        minimumGames: 5,
        hasSimilar: false,
        page: 3,
      },
    } as unknown as ComponentProps<typeof Loadouts>;

    const router = createMemoryRouter(
      [
        {
          path: '/loadouts',
          element: <Loadouts {...props} />,
        },
      ],
      {
        initialEntries: ['/loadouts?page=3&minimum=0'],
      },
    );

    render(<RouterProvider router={router} />);

    const filterBtn = screen.getByRole('button', {
      name: /has similar loadouts/i,
    });
    fireEvent.click(filterBtn);

    expect(router.state.location.search).toBe('?minimum=0&hasSimilar=true');
  });

  it('passes hasSimilar=true to getSnapshots in loader when ?hasSimilar=true is set', async () => {
    vi.mocked(getSnapshots).mockResolvedValueOnce({
      data: {
        items: [olderSnapshot],
        count: { 'snap-1': 5 },
        stats: {},
        similarCounts: { 'snap-1': 2 },
      },
      error: undefined,
    } as any);

    const request = new Request(
      'http://localhost/profile/user-1/c/char-1/loadouts?hasSimilar=true&page=1',
    );
    const result = await loader({
      params: { id: 'user-1', characterId: 'char-1' },
      request,
      context: new Map(),
    } as any);

    expect(getSnapshots).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          userId: 'user-1',
          characterId: 'char-1',
          hasSimilar: true,
        }),
      }),
    );
    expect(result.hasSimilar).toBe(true);
  });

  it('updates URL mode query param and resets page when selecting a game mode pill', () => {
    const props = {
      loaderData: {
        loadouts: {
          items: [olderSnapshot],
          count: { 'snap-1': 5 },
          stats: {},
          similarCounts: {},
        },
        gameMode: 'allGameModes' as const,
        minimumGames: 5,
        hasSimilar: false,
        page: 2,
      },
    } as unknown as ComponentProps<typeof Loadouts>;

    const router = createMemoryRouter(
      [
        {
          path: '/loadouts',
          element: <Loadouts {...props} />,
        },
      ],
      {
        initialEntries: ['/loadouts?page=2&minimum=0'],
      },
    );

    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByRole('button', { name: 'Trials' }));
    expect(router.state.location.search).toBe('?minimum=0&mode=trials');

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(router.state.location.search).toBe('?minimum=0');
  });

  it('shows a non-blocking updating indicator and marks the loadout list aria-busy during same-route filter transitions', () => {
    mockUseNavigationState.mockReturnValue({
      scope: 'same-route',
      isNavigating: true,
      isCrossRoute: false,
      isSameRoute: true,
      isSubTab: false,
      isScopedPending: true,
      nextLocation: { pathname: '/loadouts', search: '?mode=trials' },
    });

    const props = {
      loaderData: {
        loadouts: {
          items: [olderSnapshot],
          count: { 'snap-1': 5 },
          stats: {},
          similarCounts: {},
        },
        gameMode: 'allGameModes' as const,
        minimumGames: 5,
        hasSimilar: false,
        page: 1,
      },
    } as unknown as ComponentProps<typeof Loadouts>;

    const router = createMemoryRouter(
      [
        {
          path: '/loadouts',
          element: <Loadouts {...props} />,
        },
      ],
      { initialEntries: ['/loadouts'] },
    );

    const { container } = render(<RouterProvider router={router} />);

    expect(screen.getByRole('status')).toHaveTextContent('Updating…');
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});

