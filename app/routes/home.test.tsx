import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Home from './home';

const mockUseProfileData = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => mockUseProfileData(),
}));

describe('Home Page Route Component', () => {
  beforeEach(() => {
    mockUseProfileData.mockReturnValue({
      type: 'owner',
      profile: {
        id: 'user-1',
        displayName: 'TestGuardian',
        characters: [{ id: 'char-1', class: 'Hunter' }],
      },
      character: { id: 'char-1', class: 'Hunter' },
    });
  });

  it('renders RecentFormPulse with session pill, direct Start Session CTA, and hides completed SessionCard when only completed sessions exist', () => {
    const mockSession = {
      id: 'session-1',
      name: 'Trials Run 1',
      userId: 'user-1',
      characterId: 'char-1',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      aggregateIds: ['agg-1', 'agg-2'],
      status: 'complete' as const,
      summary: {
        totalMatches: 2,
        wins: 2,
        losses: 0,
        kdRatio: 1.75,
      },
    };

    const props = {
      loaderData: {
        sessions: [mockSession],
        loadouts: { items: [], count: {}, stats: {} },
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/welcome testguardian/i)).toBeInTheDocument();
    expect(screen.getByText(/recent form \(1 session\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/recent session/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /trials run 1/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/all modes · min\. 10 games/i)).toBeInTheDocument();
    expect(screen.getByText('Get in the Crucible!')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /^start session$/i }),
    ).toBeInTheDocument();
  });

  it('renders RecentFormPulse with all recent sessions up to 5 when multiple sessions exist', () => {
    const mockSessions = [
      {
        id: 'session-1',
        name: 'Trials Run 1',
        userId: 'user-1',
        characterId: 'char-1',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        aggregateIds: ['agg-1', 'agg-2'],
        status: 'complete' as const,
        summary: {
          totalMatches: 4,
          wins: 3,
          losses: 1,
          kdRatio: 1.5,
        },
      },
      {
        id: 'session-2',
        name: 'Control Warmup',
        userId: 'user-1',
        characterId: 'char-1',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        aggregateIds: ['agg-3', 'agg-4'],
        status: 'complete' as const,
        summary: {
          totalMatches: 4,
          wins: 2,
          losses: 2,
          kdRatio: 1.1,
        },
      },
    ];

    const props = {
      loaderData: {
        sessions: mockSessions,
        loadouts: { items: [], count: {}, stats: {} },
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/recent form \(2 sessions\)/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /trials run 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /control warmup/i }),
    ).toBeInTheDocument();
  });

  it('renders empty sessions state with a single primary Start First Session CTA in the empty card', () => {
    const props = {
      loaderData: {
        sessions: [],
        loadouts: { items: [], count: {}, stats: {} },
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { name: 'Sessions' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Active Session' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('No Sessions Recorded')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /browse community sessions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Get in the Crucible!')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /start first session/i }),
    ).toBeInTheDocument();
  });

  it('renders Stop Session CTA when owner has an active pending session', () => {
    const activeSession = {
      id: 'session-live',
      name: 'Live Crucible',
      userId: 'user-1',
      characterId: 'char-1',
      startedAt: new Date().toISOString(),
      status: 'pending' as const,
    };

    const props = {
      loaderData: {
        sessions: [activeSession],
        loadouts: { items: [], count: {}, stats: {} },
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    const { container } = render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('button', { name: /stop session/i }),
    ).toBeInTheDocument();
    expect(
      container.querySelector('form[action="/action/end-session"]'),
    ).toBeInTheDocument();
  });

  it('does not render session start or stop forms when viewer inspects profile', () => {
    mockUseProfileData.mockReturnValue({
      type: 'viewer',
      profile: {
        id: 'user-1',
        displayName: 'TestGuardian',
        characters: [{ id: 'char-1', class: 'Hunter' }],
      },
      character: { id: 'char-1', class: 'Hunter' },
    });

    const props = {
      loaderData: {
        sessions: [],
        loadouts: { items: [], count: {}, stats: {} },
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    const { container } = render(<RouterProvider router={router} />);

    expect(screen.getByText(/viewing testguardian/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /start.*session/i }),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('form[action="/action/end-session"]'),
    ).not.toBeInTheDocument();
  });
});

