import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FireteamMember } from '~/api';
import { toast } from '~/components/ui/sonner';

import { FireteamProvider, useFireteam } from './fireteam-context';

vi.mock('~/hooks/use-route-loaders', () => ({
  useIsNavigating: () => [false],
}));

vi.mock('~/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const sampleMembers: FireteamMember[] = [
  {
    id: 'u1',
    membershipId: 'm1',
    displayName: 'Alpha',
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
      {
        id: 'c1-alt',
        class: 'Warlock',
        race: 'Awoken',
        light: BigInt(2015),
        currentTitle: '',
        emblemURL: '/e2.png',
        emblemBackgroundURL: '/b2.png',
        emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
      },
    ],
  },
];

function ContextConsumer() {
  const {
    selectedTargets,
    trackComp,
    setTrackComp,
    toggleMemberBulkSelect,
    selectMemberCharacter,
    submitBulkStart,
    dismissResults,
    visibleResults,
    errorMessage,
  } = useFireteam();

  return (
    <div>
      <span data-testid="targets">{JSON.stringify(selectedTargets)}</span>
      <span data-testid="trackComp">{String(trackComp)}</span>
      <span data-testid="resultsCount">{visibleResults?.length ?? 0}</span>
      <span data-testid="error">{errorMessage ?? ''}</span>
      <button type="button" onClick={() => setTrackComp(!trackComp)}>
        Toggle Comp
      </button>
      <button type="button" onClick={() => toggleMemberBulkSelect('u1', false)}>
        Exclude Alpha
      </button>
      <button
        type="button"
        onClick={() => selectMemberCharacter('u1', 'c1-alt')}
      >
        Swap Alpha
      </button>
      <button type="button" onClick={submitBulkStart}>
        Submit
      </button>
      <button type="button" onClick={dismissResults}>
        Dismiss
      </button>
    </div>
  );
}

describe('FireteamContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when useFireteam is called outside FireteamProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function BadConsumer() {
      useFireteam();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(
      'useFireteam must be used within a FireteamProvider',
    );
    spy.mockRestore();
  });

  it('shares selection updates, submits bulk start, displays toast, and supports dismissing results', async () => {
    const actionSpy = vi.fn(async () => ({
      ok: true,
      results: [
        {
          userId: 'u1',
          characterId: 'c1-alt',
          outcome: 'started',
          session: {
            id: 'sess-1',
            userId: 'u1',
            characterId: 'c1-alt',
            startedAt: new Date('2026-11-25T00:00:00Z'),
            status: 'pending',
            aggregateIds: [],
          },
        },
      ],
    }));

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <FireteamProvider
              members={sampleMembers}
              fireteamMemWithCharacters={{ u1: 'c1' }}
            >
              <ContextConsumer />
            </FireteamProvider>
          ),
        },
        {
          path: '/action/start-fireteam-sessions',
          action: actionSpy,
        },
      ],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByTestId('targets')).toHaveTextContent(
      JSON.stringify([{ userId: 'u1', characterId: 'c1' }]),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Swap Alpha' }));
    expect(screen.getByTestId('targets')).toHaveTextContent(
      JSON.stringify([{ userId: 'u1', characterId: 'c1-alt' }]),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Comp' }));
    expect(screen.getByTestId('trackComp')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByTestId('resultsCount')).toHaveTextContent('1');
    });
    expect(toast.success).toHaveBeenCalledWith('Started 1 fireteam session.');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByTestId('resultsCount')).toHaveTextContent('0');
  });

  it('exposes errorMessage and fires error toast when bulk start fails', async () => {
    const actionSpy = vi.fn(async () => ({
      ok: false,
      error: 'Target user is not in your fireteam',
    }));

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <FireteamProvider
              members={sampleMembers}
              fireteamMemWithCharacters={{ u1: 'c1' }}
            >
              <ContextConsumer />
            </FireteamProvider>
          ),
        },
        {
          path: '/action/start-fireteam-sessions',
          action: actionSpy,
        },
      ],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={router} />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Target user is not in your fireteam',
      );
    });
    expect(toast.error).toHaveBeenCalledWith(
      'Target user is not in your fireteam',
    );
  });
});
