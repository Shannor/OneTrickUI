import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFireteamData } from '~/.server/fireteam';
import { setPreferences } from '~/.server/preferences';
import type { FireteamMember } from '~/api';
import { toast } from '~/components/ui/sonner';

import Fireteam, { loader } from './fireteam';

vi.mock('~/.server/fireteam', () => ({
  getFireteamData: vi.fn(),
}));

vi.mock('~/.server/preferences', () => ({
  setPreferences: vi.fn(),
}));

vi.mock('~/hooks/use-route-loaders', () => ({
  useIsNavigating: () => [false],
}));

vi.mock('~/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const makeCharacter = (
  id: string,
  cls: string,
  title = '',
): FireteamMember['characters'][number] => ({
  id,
  class: cls,
  race: 'Awoken',
  light: BigInt(2020),
  emblemURL: '/logo.svg',
  emblemBackgroundURL: '/bg.svg',
  currentTitle: title,
  emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
});

const mixedMembers: FireteamMember[] = [
  {
    id: 'user-1',
    membershipId: 'mem-1',
    displayName: 'ActiveHunter',
    characters: [makeCharacter('char-1-hunter', 'Hunter', 'Flawless')],
    activeSessions: [
      {
        sessionId: 'sess-existing-1',
        characterId: 'char-1-hunter',
        startedAt: new Date('2026-11-25T00:00:00Z'),
        trackComp: true,
      },
    ],
  },
  {
    id: 'user-2',
    membershipId: 'mem-2',
    displayName: 'ReadyTitan',
    characters: [
      makeCharacter('char-2-titan', 'Titan', 'Iron Lord'),
      makeCharacter('char-2-warlock', 'Warlock', 'Glorious'),
    ],
  },
  {
    id: 'user-3',
    membershipId: 'mem-3',
    displayName: 'ReadyWarlock',
    characters: [makeCharacter('char-3-warlock', 'Warlock', 'Unbroken')],
  },
];

describe('Fireteam Route loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(setPreferences).mockResolvedValue({
      headers: { 'Set-Cookie': 'prefs=1' },
    });
  });

  it('loads fireteam members directly from GET /fireteam activeSessions without extra per-member requests', async () => {
    vi.mocked(getFireteamData).mockResolvedValueOnce({
      status: 'success',
      fireteam: [
        {
          id: 'user-1',
          membershipId: 'mem-1',
          displayName: 'ActiveHunter',
          characters: [
            makeCharacter('char-1-titan', 'Titan'),
            makeCharacter('char-1-hunter', 'Hunter'),
          ],
          activeSessions: [
            {
              sessionId: 'sess-1',
              characterId: 'char-1-hunter',
              startedAt: new Date('2026-11-25T00:00:00Z'),
            },
          ],
        },
      ],
      selectedCharacters: undefined,
    });

    const request = new Request(
      'http://localhost/profile/user-1/c/char-1-hunter/fireteam',
    );
    const result = (await loader({ request } as never)) as {
      data: {
        members: FireteamMember[];
        fireteamMemWithCharacters: Record<string, string>;
      };
    };

    expect(getFireteamData).toHaveBeenCalledTimes(1);
    expect(result.data.members).toHaveLength(1);
    expect(result.data.fireteamMemWithCharacters['user-1']).toBe(
      'char-1-hunter',
    );
  });
});

describe('Fireteam Route Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders offline empty state when member list is empty', () => {
    const props = {
      loaderData: {
        members: [],
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
    expect(document.title).toBe('Fireteam | 1 Trick');
  });

  it('renders mixed fireteam state (1 already active, 2 ready) and submits one bulk start request', async () => {
    const bulkActionSpy = vi.fn(async ({ request }: { request: Request }) => {
      const formData = await request.formData();
      const submittedMembers = JSON.parse(String(formData.get('members')));
      const trackComp = formData.get('trackComp') === 'true';

      expect(submittedMembers).toEqual([
        { userId: 'user-2', characterId: 'char-2-warlock' },
        { userId: 'user-3', characterId: 'char-3-warlock' },
      ]);
      expect(trackComp).toBe(true);

      return {
        ok: true,
        results: [
          {
            userId: 'user-2',
            characterId: 'char-2-warlock',
            outcome: 'started',
            session: {
              id: 'sess-new-2',
              userId: 'user-2',
              characterId: 'char-2-warlock',
              startedAt: '2026-11-25T00:10:00.000Z',
              status: 'pending',
              aggregateIds: [],
              compTracking: { enabled: true },
            },
          },
          {
            userId: 'user-3',
            characterId: 'char-3-warlock',
            outcome: 'started',
            session: {
              id: 'sess-new-3',
              userId: 'user-3',
              characterId: 'char-3-warlock',
              startedAt: '2026-11-25T00:10:00.000Z',
              status: 'pending',
              aggregateIds: [],
              compTracking: { enabled: true },
            },
          },
        ],
      };
    });

    const props = {
      loaderData: {
        members: mixedMembers,
        fireteamMemWithCharacters: {
          'user-1': 'char-1-hunter',
          'user-2': 'char-2-titan',
          'user-3': 'char-3-warlock',
        },
      },
    } as unknown as ComponentProps<typeof Fireteam>;

    const router = createMemoryRouter(
      [
        {
          path: '/fireteam',
          element: <Fireteam {...props} />,
        },
        {
          path: '/action/start-fireteam-sessions',
          action: bulkActionSpy,
        },
      ],
      {
        initialEntries: ['/fireteam'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Fireteam Overview')).toBeInTheDocument();
    expect(screen.getByText('3 Teammates')).toBeInTheDocument();
    expect(screen.getByText('1 Active')).toBeInTheDocument();
    expect(
      screen.getByText('2 selected to start · 1 already tracking (skipped)'),
    ).toBeInTheDocument();

    const initialLiveLinks = screen.getAllByRole('link', {
      name: /view live session/i,
    });
    expect(initialLiveLinks).toHaveLength(1);
    expect(initialLiveLinks[0]).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-1-hunter/sessions/sess-existing-1',
    );

    fireEvent.click(screen.getByRole('button', { name: /swap guardian/i }));
    fireEvent.click(screen.getByText('Glorious'));

    fireEvent.click(
      screen.getByRole('checkbox', { name: /track competitive score/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /start fireteam \(2\)/i }),
    );

    await waitFor(() => {
      expect(bulkActionSpy).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('3 Active')).toBeInTheDocument();
    });

    expect(
      screen.getByText('All teammates are actively tracking a session.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Started 2 fireteam sessions.'),
    ).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Started 2 fireteam sessions.');

    const updatedLiveLinks = screen
      .getAllByRole('link', { name: /view live session/i })
      .map((el) => el.getAttribute('href'));
    expect(updatedLiveLinks).toEqual([
      '/profile/user-1/c/char-1-hunter/sessions/sess-existing-1',
      '/profile/user-2/c/char-2-warlock/sessions/sess-new-2',
      '/profile/user-3/c/char-3-warlock/sessions/sess-new-3',
    ]);
  });

  it('updates UI state and toast for both started and skipped_active members returned from bulk start', async () => {
    const bulkActionSpy = vi.fn(async () => ({
      ok: true,
      results: [
        {
          userId: 'user-2',
          characterId: 'char-2-titan',
          outcome: 'skipped_active',
          session: {
            id: 'sess-race-2',
            userId: 'user-2',
            characterId: 'char-2-titan',
            startedAt: '2026-11-25T00:08:00.000Z',
            status: 'pending',
            aggregateIds: ['g1'],
          },
        },
        {
          userId: 'user-3',
          characterId: 'char-3-warlock',
          outcome: 'started',
          session: {
            id: 'sess-new-3',
            userId: 'user-3',
            characterId: 'char-3-warlock',
            startedAt: '2026-11-25T00:10:00.000Z',
            status: 'pending',
            aggregateIds: [],
          },
        },
      ],
    }));

    const props = {
      loaderData: {
        members: mixedMembers,
        fireteamMemWithCharacters: {
          'user-1': 'char-1-hunter',
          'user-2': 'char-2-titan',
          'user-3': 'char-3-warlock',
        },
      },
    } as unknown as ComponentProps<typeof Fireteam>;

    const router = createMemoryRouter(
      [
        {
          path: '/fireteam',
          element: <Fireteam {...props} />,
        },
        {
          path: '/action/start-fireteam-sessions',
          action: bulkActionSpy,
        },
      ],
      {
        initialEntries: ['/fireteam'],
      },
    );

    render(<RouterProvider router={router} />);

    fireEvent.click(
      screen.getByRole('button', { name: /start fireteam \(2\)/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText('Started 1 session; skipped 1 already active.'),
      ).toBeInTheDocument();
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Started 1 session; skipped 1 already active.',
    );
    expect(screen.getByText('Already Active (Skipped)')).toBeInTheDocument();
    expect(screen.getByText('Started via Fireteam')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /readytitan.*skipped \(active\)/i }),
    ).toHaveAttribute(
      'href',
      '/profile/user-2/c/char-2-titan/sessions/sess-race-2',
    );
  });
});
