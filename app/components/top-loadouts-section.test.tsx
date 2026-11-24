import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { CharacterSnapshot } from '~/api';

import {
  EMPTY_TOP_LOADOUTS,
  type TopLoadoutsResult,
  TopLoadoutsSection,
} from './top-loadouts-section';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const mockSnapshot: CharacterSnapshot = {
  id: 'snap-top-1',
  name: 'Solar Hand Cannon Build',
  userId: 'user-1',
  characterId: 'char-1',
  hash: 'hash-top-1',
  createdAt: new Date('2025-02-01T00:00:00Z'),
  updatedAt: new Date('2025-02-01T00:00:00Z'),
  loadout: {},
};

function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter([{ path: '/', element: ui }]);
  return render(<RouterProvider router={router} />);
}

describe('TopLoadoutsSection', () => {
  it('renders heading, badge, and skeleton grid while loadouts promise is pending, then streams cards and link on resolve', async () => {
    const deferred = createDeferred<TopLoadoutsResult>();
    const onSelectLoadout = vi.fn();

    renderWithRouter(
      <TopLoadoutsSection
        loadouts={deferred.promise}
        isOwner={true}
        hasSessions={true}
        userId="user-1"
        characterId="char-1"
        onSelectLoadout={onSelectLoadout}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Top Loadouts' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/all modes · min\. 10 games/i)).toBeInTheDocument();
    expect(screen.getByTestId('top-loadouts-skeleton')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /view all loadouts/i }),
    ).not.toBeInTheDocument();

    await act(async () => {
      deferred.resolve({
        data: {
          items: [mockSnapshot],
          count: { 'snap-top-1': 14 },
          stats: {
            'snap-top-1': {
              kd: { value: 1.85 },
              kda: { value: 2.3 },
              standing: { value: 0.71 },
            },
          },
        },
        error: undefined,
      });
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId('top-loadouts-skeleton'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('Solar Hand Cannon Build')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view all loadouts/i }),
    ).toHaveAttribute('href', '/profile/user-1/c/char-1/loadouts');
  });

  it('renders empty state without View all loadouts link when resolved with zero loadouts', async () => {
    renderWithRouter(
      <TopLoadoutsSection
        loadouts={{ data: EMPTY_TOP_LOADOUTS, error: undefined }}
        isOwner={false}
        hasSessions={true}
        userId="user-1"
        characterId="char-1"
        onSelectLoadout={vi.fn()}
      />,
    );

    expect(screen.getByText('No Top Loadouts Yet')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /view all loadouts/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /browse all loadouts/i }),
    ).toHaveAttribute('href', '/profile/user-1/c/char-1/loadouts?minimum=1');
  });

  it('renders graceful error fallback when resolved result has an error', () => {
    renderWithRouter(
      <TopLoadoutsSection
        loadouts={{
          data: EMPTY_TOP_LOADOUTS,
          error: 'Failed to load top loadouts',
        }}
        isOwner={true}
        hasSessions={true}
        userId="user-1"
        characterId="char-1"
        onSelectLoadout={vi.fn()}
      />,
    );

    expect(screen.getByText('Unable to Load Top Loadouts')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /view all loadouts/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /browse all loadouts/i }),
    ).toBeInTheDocument();
  });

  it('renders graceful error fallback when loadouts promise rejects', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const deferred = createDeferred<TopLoadoutsResult>();

    renderWithRouter(
      <TopLoadoutsSection
        loadouts={deferred.promise}
        isOwner={true}
        hasSessions={false}
        userId="user-1"
        characterId="char-1"
        onSelectLoadout={vi.fn()}
      />,
    );

    expect(screen.getByTestId('top-loadouts-skeleton')).toBeInTheDocument();

    await act(async () => {
      deferred.reject(new Error('Network failure'));
    });

    await waitFor(() => {
      expect(
        screen.getByText('Unable to Load Top Loadouts'),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('link', { name: /view all loadouts/i }),
    ).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
