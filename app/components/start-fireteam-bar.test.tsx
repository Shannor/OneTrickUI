import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { BulkFireteamSessionResult } from '~/lib/fireteam-sessions';

import {
  StartFireteamBar,
  type StartFireteamBarProps,
} from './start-fireteam-bar';

function renderBar(props: StartFireteamBarProps) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <StartFireteamBar {...props} />,
    },
  ]);

  return render(<RouterProvider router={router} />);
}

describe('StartFireteamBar', () => {
  it('renders mixed fireteam counts, trackComp toggle, and invokes onSubmit on click', () => {
    const onTrackCompChange = vi.fn();
    const onSubmit = vi.fn();

    renderBar({
      selectedTargets: [
        { userId: 'u2', characterId: 'c2' },
        { userId: 'u3', characterId: 'c3' },
      ],
      readyCount: 2,
      activeCount: 1,
      trackComp: false,
      onTrackCompChange,
      onSubmit,
      isSubmitting: false,
      memberNames: { u1: 'Alpha', u2: 'Bravo', u3: 'Charlie' },
    });

    expect(
      screen.getByText('2 selected to start · 1 already tracking (skipped)'),
    ).toBeInTheDocument();

    const compToggle = screen.getByRole('checkbox', {
      name: /track competitive score/i,
    });
    fireEvent.click(compToggle);
    expect(onTrackCompChange).toHaveBeenCalledWith(true);

    const startButton = screen.getByRole('button', {
      name: /start fireteam \(2\)/i,
    });
    expect(startButton).not.toBeDisabled();
    fireEvent.click(startButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables button and displays all-active copy when no members need starting', () => {
    renderBar({
      selectedTargets: [],
      readyCount: 0,
      activeCount: 3,
      trackComp: false,
      onTrackCompChange: vi.fn(),
      onSubmit: vi.fn(),
      isSubmitting: false,
      memberNames: {},
    });

    expect(
      screen.getByText('All teammates are actively tracking a session.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /start fireteam/i }),
    ).toBeDisabled();
  });

  it('renders per-member started and skipped_active results with session links', () => {
    const onDismissResults = vi.fn();
    const results: BulkFireteamSessionResult[] = [
      {
        userId: 'u1',
        characterId: 'c1',
        outcome: 'skipped_active',
        session: {
          id: 'sess-1',
          userId: 'u1',
          characterId: 'c1',
          startedAt: '2026-11-25T00:00:00.000Z',
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
          startedAt: '2026-11-25T00:05:00.000Z',
          status: 'pending',
          aggregateIds: [],
        },
      },
    ];

    renderBar({
      selectedTargets: [],
      readyCount: 0,
      activeCount: 2,
      trackComp: true,
      onTrackCompChange: vi.fn(),
      onSubmit: vi.fn(),
      isSubmitting: false,
      results,
      memberNames: { u1: 'Alpha', u2: 'Bravo' },
      onDismissResults,
    });

    expect(
      screen.getByText('Started 1 session; skipped 1 already active.'),
    ).toBeInTheDocument();

    const alphaLink = screen.getByRole('link', {
      name: /alpha.*skipped \(active\)/i,
    });
    expect(alphaLink).toHaveAttribute(
      'href',
      '/profile/u1/c/c1/sessions/sess-1',
    );

    const bravoLink = screen.getByRole('link', { name: /bravo.*started/i });
    expect(bravoLink).toHaveAttribute(
      'href',
      '/profile/u2/c/c2/sessions/sess-2',
    );

    fireEvent.click(screen.getByRole('button', { name: /dismiss results/i }));
    expect(onDismissResults).toHaveBeenCalledTimes(1);
  });

  it('renders error alert when errorMessage is provided', () => {
    renderBar({
      selectedTargets: [{ userId: 'u2', characterId: 'c2' }],
      readyCount: 1,
      activeCount: 0,
      trackComp: false,
      onTrackCompChange: vi.fn(),
      onSubmit: vi.fn(),
      isSubmitting: false,
      errorMessage: 'Target user is not in your fireteam',
      memberNames: {},
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Target user is not in your fireteam',
    );
  });
});
