import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { FireteamSessionResult } from '~/api';

import {
  BulkStartErrorAlert,
  BulkStartResultsSummary,
} from './bulk-start-results';
import { FireteamContext, type FireteamContextValue } from './fireteam-context';

function makeContextValue(
  overrides: Partial<FireteamContextValue> = {},
): FireteamContextValue {
  return {
    memberViews: [],
    memberNames: {},
    selectedTargets: [],
    readyCount: 0,
    activeHeaderCount: 0,
    activeSelectedCount: 0,
    trackComp: false,
    setTrackComp: vi.fn(),
    isBulkSubmitting: false,
    isSubmitting: false,
    submitBulkStart: vi.fn(),
    dismissResults: vi.fn(),
    toggleMemberBulkSelect: vi.fn(),
    selectMemberCharacter: vi.fn(),
    ...overrides,
  };
}

describe('BulkStartErrorAlert', () => {
  it('renders nothing when errorMessage is absent', () => {
    const value = makeContextValue();
    render(
      <FireteamContext.Provider value={value}>
        <BulkStartErrorAlert />
      </FireteamContext.Provider>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders alert text when errorMessage is provided', () => {
    const value = makeContextValue({
      errorMessage: 'Target user is not in your fireteam',
    });
    render(
      <FireteamContext.Provider value={value}>
        <BulkStartErrorAlert />
      </FireteamContext.Provider>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Target user is not in your fireteam',
    );
  });
});

describe('BulkStartResultsSummary', () => {
  it('renders per-member started and skipped_active results with session links and dismiss action', () => {
    const results: FireteamSessionResult[] = [
      {
        userId: 'u1',
        characterId: 'c1',
        outcome: 'skipped_active',
        session: {
          id: 'sess-1',
          userId: 'u1',
          characterId: 'c1',
          startedAt: new Date('2026-11-25T00:00:00.000Z'),
          status: 'pending',
          aggregateIds: [],
        },
      },
      {
        userId: 'u2',
        characterId: 'c2',
        outcome: 'started',
        session: {
          id: 'sess-2',
          userId: 'u2',
          characterId: 'c2',
          startedAt: new Date('2026-11-25T00:05:00.000Z'),
          status: 'pending',
          aggregateIds: [],
        },
      },
    ];

    const value = makeContextValue({
      visibleResults: results,
      memberNames: { u1: 'Alpha', u2: 'Bravo' },
    });

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <FireteamContext.Provider value={value}>
            <BulkStartResultsSummary />
          </FireteamContext.Provider>
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByText('Started 1 session; skipped 1 already active.'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /alpha.*skipped \(active\)/i }),
    ).toHaveAttribute('href', '/profile/u1/c/c1/sessions/sess-1');

    expect(
      screen.getByRole('link', { name: /bravo.*started/i }),
    ).toHaveAttribute('href', '/profile/u2/c/c2/sessions/sess-2');

    fireEvent.click(screen.getByRole('button', { name: /dismiss results/i }));
    expect(value.dismissResults).toHaveBeenCalledTimes(1);
  });
});
