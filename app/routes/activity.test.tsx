import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRequestLogger } from '~/.server/logger';
import { getActivity, getSession } from '~/api';

import { Activity, loader } from './activity';

vi.mock('~/api', () => ({
  getActivity: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('~/.server/logger', () => ({
  getRequestLogger: vi.fn(),
}));

vi.mock('~/charts/ClassStats', () => ({
  ClassStats: () => <div data-testid="class-stats" />,
}));

const mockLog = {
  set: vi.fn(),
  error: vi.fn(),
};

const sampleActivityResponse = {
  activity: {
    instanceId: '17183272072',
    location: 'Eternity',
    activity: 'Crucible',
    description: 'Crucible match',
    mode: 'Clash Quickplay',
    period: new Date('2026-11-26T00:00:00Z'),
    referenceId: BigInt(1),
    activityHash: BigInt(2),
    imageUrl: 'https://www.bungie.net/img/eternity.jpg',
    activityIcon: 'https://www.bungie.net/img/clash.png',
  },
  teams: [
    { id: '19', teamName: '19', score: '35', standing: 'Victory' },
    { id: '20', teamName: '20', score: '7', standing: 'Defeat' },
  ],
  participants: [
    {
      characterId: 'char-1',
      membershipId: 'mem-1',
      membershipType: 1,
      displayName: 'Zone 6 Weegee',
      displayNameCode: '9629',
      characterClass: 'Hunter',
      lightLevel: 547,
      teamId: '19',
      standing: 0,
      score: { value: 19, displayValue: '19' },
      completed: true,
      userId: 'user-1',
      sessionId: 'sess-1',
      snapshotId: 'snap-1',
      confidenceLevel: 'high' as const,
      performance: {
        playerStats: {
          kills: { value: 15 },
          deaths: { value: 3 },
          assists: { value: 4 },
        },
        weapons: {},
      },
    },
    {
      characterId: 'char-2',
      membershipId: 'mem-2',
      membershipType: 1,
      displayName: 'SessionOnlyAlly',
      displayNameCode: '1234',
      characterClass: 'Titan',
      lightLevel: 540,
      teamId: '19',
      standing: 0,
      score: { value: 10, displayValue: '10' },
      completed: true,
      userId: 'user-2',
      sessionId: 'sess-2',
      confidenceLevel: 'noMatch' as const,
      performance: {
        playerStats: {
          kills: { value: 8 },
          deaths: { value: 4 },
          assists: { value: 2 },
        },
        weapons: {},
      },
    },
    {
      characterId: 'char-3',
      membershipId: 'mem-3',
      membershipType: 1,
      displayName: 'OpponentOne',
      displayNameCode: '5678',
      characterClass: 'Warlock',
      lightLevel: 510,
      teamId: '20',
      standing: 1,
      score: { value: 7, displayValue: '7' },
      completed: true,
      performance: {
        playerStats: {
          kills: { value: 5 },
          deaths: { value: 11 },
          assists: { value: 0 },
        },
        weapons: {},
      },
    },
  ],
  snapshots: {
    'char-1': {
      id: 'snap-1',
      name: 'Hunter Loadout',
      userId: 'user-1',
      characterId: 'char-1',
      createdAt: new Date('2026-11-26T00:00:00Z'),
      hash: 'hash-1',
      loadout: {},
      stats: {},
    },
  },
  users: {},
};

describe('Activity route loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRequestLogger).mockReturnValue(mockLog as never);
  });

  it('sets evlog wide-event participant and tracking counts when activity loads', async () => {
    vi.mocked(getActivity).mockResolvedValue({
      data: sampleActivityResponse,
      error: undefined,
    } as never);

    const result = await loader({
      params: { instanceId: '17183272072' },
      context: {},
    } as never);

    expect(result.error).toBeUndefined();
    expect(result.activityDetails).toBe(sampleActivityResponse);
    expect(mockLog.set).toHaveBeenCalledWith({
      activity: {
        instanceId: '17183272072',
        found: true,
        participantCount: 3,
        trackedLoadoutCount: 1,
        trackedSessionCount: 2,
      },
    });
  });

  it('returns error payload and logs when getActivity fails', async () => {
    vi.mocked(getActivity).mockResolvedValue({
      data: undefined,
      error: { message: 'Boom' },
    } as never);

    const result = await loader({
      params: { instanceId: 'bad-id' },
      context: {},
    } as never);

    expect(result).toEqual({
      activityDetails: undefined,
      session: undefined,
      error: 'Failed to load activity',
    });
    expect(mockLog.error).toHaveBeenCalled();
  });

  it('loads originating session in parallel when sessionId param is provided', async () => {
    const sampleSession = { id: 'sess-1', name: 'Trials Card' };
    vi.mocked(getActivity).mockResolvedValue({
      data: sampleActivityResponse,
      error: undefined,
    } as never);
    vi.mocked(getSession).mockResolvedValue({
      data: sampleSession,
      error: undefined,
    } as never);

    const result = await loader({
      params: { instanceId: '17183272072', sessionId: 'sess-1' },
      context: {},
    } as never);

    expect(getSession).toHaveBeenCalledWith({
      path: { sessionId: 'sess-1' },
    });
    expect(result.error).toBeUndefined();
    expect(result.activityDetails).toBe(sampleActivityResponse);
    expect(result.session).toBe(sampleSession);
  });

  it('still loads activity when optional originating session lookup rejects', async () => {
    vi.mocked(getActivity).mockResolvedValue({
      data: sampleActivityResponse,
      error: undefined,
    } as never);
    vi.mocked(getSession).mockRejectedValue(new Error('Network error'));

    const result = await loader({
      params: { instanceId: '17183272072', sessionId: 'sess-1' },
      context: {},
    } as never);

    expect(result.error).toBeUndefined();
    expect(result.activityDetails).toBe(sampleActivityResponse);
    expect(result.session).toBeUndefined();
  });
});

describe('Activity route component', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('renders full match scoreboard with all participants', () => {
    const props = {
      loaderData: {
        activityDetails: sampleActivityResponse,
        error: undefined,
      },
      params: {
        id: 'user-1',
        characterId: 'char-1',
        instanceId: '17183272072',
      },
    } as unknown as ComponentProps<typeof Activity>;

    render(
      <MemoryRouter>
        <Activity {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Eternity')).toBeInTheDocument();
    expect(screen.getByText('Match Scoreboard')).toBeInTheDocument();
    expect(screen.getByText('3 Guardians')).toBeInTheDocument();
    expect(screen.getByText('Zone 6 Weegee')).toBeInTheDocument();
    expect(screen.getByText('SessionOnlyAlly')).toBeInTheDocument();
    expect(screen.getByText('OpponentOne')).toBeInTheDocument();
    expect(screen.queryByText('Viewing')).not.toBeInTheDocument();
  });

  it('renders not-found empty state when activityDetails is missing', () => {
    const props = {
      loaderData: {
        activityDetails: undefined,
        error: 'Activity Not Found',
      },
      params: {
        id: 'user-1',
        characterId: 'char-1',
        instanceId: 'missing-id',
      },
    } as unknown as ComponentProps<typeof Activity>;

    render(
      <MemoryRouter>
        <Activity {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByText('No Activity Found')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to Sessions' }),
    ).toHaveAttribute('href', '/profile/user-1/c/char-1/sessions');
  });

  it('links back to the originating session in not-found empty state when sessionId is present', () => {
    const props = {
      loaderData: {
        activityDetails: undefined,
        session: { id: 'sess-1', name: 'Trials Card' },
        error: 'Activity Not Found',
      },
      params: {
        id: 'user-1',
        characterId: 'char-1',
        sessionId: 'sess-1',
        instanceId: 'missing-id',
      },
    } as unknown as ComponentProps<typeof Activity>;

    render(
      <MemoryRouter>
        <Activity {...props} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'Back to Session' }),
    ).toHaveAttribute('href', '/profile/user-1/c/char-1/sessions/sess-1');
  });
});
