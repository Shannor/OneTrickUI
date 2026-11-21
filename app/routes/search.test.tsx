import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchUserResult } from '~/api';

import { Search, type SearchLoaderData, loader } from './search';

const mockGetAuth = vi.fn();
const mockSearch = vi.fn();
const mockLogSet = vi.fn();
const mockLogError = vi.fn();

vi.mock('~/.server/auth', () => ({
  getAuth: (...args: unknown[]) => mockGetAuth(...args),
}));

vi.mock('~/.server/logger', () => ({
  getRequestLogger: () => ({
    set: mockLogSet,
    error: mockLogError,
  }),
}));

vi.mock('~/api', () => ({
  search: (...args: unknown[]) => mockSearch(...args),
}));

vi.mock('~/hooks/use-route-loaders', () => ({
  useIsNavigating: () => [false],
}));

const recordedUser: SearchUserResult = {
  isRecorded: true,
  userId: 'TTXWDT9pzDEA0XiO1iAc',
  primaryMembershipId: '4611686018467890123',
  displayName: 'Zone 6 Weegee',
  uniqueName: 'Zone 6 Weegee#1234',
  alternateNames: [],
  characters: [
    {
      id: '2305843009261519028',
      light: 2010n,
      emblemURL: '/common/destiny2_content/icons/hunter.jpg',
      emblemBackgroundURL: '/common/destiny2_content/icons/bg.jpg',
      currentTitle: 'Flawless',
      emblemColor: { red: 0, green: 0, blue: 0, alpha: 255 },
      race: 'Human',
      class: 'Hunter',
    },
  ],
};

const unrecordedUser: SearchUserResult = {
  isRecorded: false,
  primaryMembershipId: '4611686018499999999',
  displayName: 'NewGuardian',
  uniqueName: 'NewGuardian#5678',
  alternateNames: [],
};

function renderSearchPage(loaderData: SearchLoaderData) {
  const router = createMemoryRouter(
    [
      {
        path: '/search',
        element: (
          <Search loaderData={loaderData} params={{}} matches={[] as any} />
        ),
      },
    ],
    { initialEntries: ['/search'] },
  );
  return render(<RouterProvider router={router} />);
}

function createLoaderArgs(urlStr: string) {
  return {
    request: new Request(urlStr),
    url: new URL(urlStr),
    pattern: '/search',
    params: {},
    context: {} as any,
  };
}

describe('Search route loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips API call when query is empty for signed-out user', async () => {
    mockGetAuth.mockResolvedValue(null);

    const result = await loader(
      createLoaderArgs('http://localhost:5173/search'),
    );

    expect(mockSearch).not.toHaveBeenCalled();
    expect(result).toEqual({
      query: '',
      page: 0,
      results: [],
      hasMore: false,
      isSignedIn: false,
      currentUserId: undefined,
    });
    expect(mockLogSet).toHaveBeenCalledWith(
      expect.objectContaining({
        route: 'routes/search',
        user: { authenticated: false, id: undefined },
        search: expect.objectContaining({ hasQuery: false, page: 0 }),
      }),
    );
  });

  it('searches with q and page params for signed-in user and logs recorded count', async () => {
    mockGetAuth.mockResolvedValue({ id: 'TTXWDT9pzDEA0XiO1iAc' });
    mockSearch.mockResolvedValue({
      data: { results: [recordedUser, unrecordedUser], hasMore: true },
      error: undefined,
      response: { status: 200 },
    });

    const result = await loader(
      createLoaderArgs('http://localhost:5173/search?q=Weegee%231234&page=1'),
    );

    expect(mockSearch).toHaveBeenCalledWith({
      body: { prefix: 'Weegee#1234', page: 1 },
    });
    expect(result).toEqual({
      query: 'Weegee#1234',
      page: 1,
      results: [recordedUser, unrecordedUser],
      hasMore: true,
      isSignedIn: true,
      currentUserId: 'TTXWDT9pzDEA0XiO1iAc',
    });
    expect(mockLogSet).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { authenticated: true, id: 'TTXWDT9pzDEA0XiO1iAc' },
        search: expect.objectContaining({
          hasQuery: true,
          hasDiscriminator: true,
          page: 1,
          resultCount: 2,
          recordedCount: 1,
          hasMore: true,
        }),
      }),
    );
  });

  it('supports legacy query param and clamps negative page to 0', async () => {
    mockGetAuth.mockResolvedValue(null);
    mockSearch.mockResolvedValue({
      data: { results: [], hasMore: false },
      error: undefined,
      response: { status: 200 },
    });

    const result = await loader(
      createLoaderArgs('http://localhost:5173/search?query=Guardian&page=-3'),
    );

    expect(mockSearch).toHaveBeenCalledWith({
      body: { prefix: 'Guardian', page: 0 },
    });
    expect(result.query).toBe('Guardian');
    expect(result.page).toBe(0);
  });

  it('handles backend errors gracefully and logs error event', async () => {
    mockGetAuth.mockResolvedValue(null);
    mockSearch.mockResolvedValue({
      data: undefined,
      error: { message: 'Internal error' },
      response: { status: 500 },
    });

    const result = await loader(
      createLoaderArgs('http://localhost:5173/search?q=Guardian'),
    );

    expect(result.results).toEqual([]);
    expect(result.errorMessage).toBe(
      'Unable to search Guardians right now. Please try again.',
    );
    expect(mockLogError).toHaveBeenCalledWith('Player search request failed', {
      search: {
        page: 0,
        queryLength: 8,
        status: 500,
      },
    });
  });
});

describe('Search route component', () => {
  it('renders 1 Trick title and initial empty prompt when no query is provided', () => {
    renderSearchPage({
      query: '',
      page: 0,
      results: [],
      hasMore: false,
      isSignedIn: false,
    });

    expect(document.title).toBe('Search Guardians | 1 Trick');
    expect(
      screen.getByRole('heading', { level: 1, name: /search guardians/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/look up any destiny 2 guardian/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /start recording/i }),
    ).toHaveAttribute('href', '/login');
  });

  it('renders mixed recorded and unrecorded results with dynamic 1 Trick title and pagination', () => {
    renderSearchPage({
      query: 'Weegee',
      page: 0,
      results: [recordedUser, unrecordedUser],
      hasMore: true,
      isSignedIn: false,
    });

    expect(document.title).toBe('Search "Weegee" | 1 Trick');
    expect(screen.getByText('Recorded on 1 Trick')).toBeInTheDocument();
    expect(screen.getByText('Not Recorded')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view profile/i })).toHaveAttribute(
      'href',
      '/profile/TTXWDT9pzDEA0XiO1iAc',
    );
    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute(
      'href',
      '/search?q=Weegee&page=1',
    );
  });

  it('renders zero-results state with Start Recording and Share 1 Trick CTAs', () => {
    renderSearchPage({
      query: 'NoSuchGuardian',
      page: 0,
      results: [],
      hasMore: false,
      isSignedIn: true,
    });

    expect(screen.getByText(/no guardians found for/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /start recording/i }),
    ).toHaveAttribute('href', '/login');
    expect(
      screen.getByRole('button', { name: /share 1 trick/i }),
    ).toBeInTheDocument();
  });

  it('renders error banner when backend search fails', () => {
    renderSearchPage({
      query: 'Guardian',
      page: 0,
      results: [],
      hasMore: false,
      isSignedIn: false,
      errorMessage: 'Unable to search Guardians right now. Please try again.',
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to search Guardians right now. Please try again.',
    );
    expect(screen.getByRole('link', { name: /try again/i })).toHaveAttribute(
      'href',
      '/search?q=Guardian',
    );
  });
});
