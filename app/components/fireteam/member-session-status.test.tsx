import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { FireteamMember } from '~/api';
import type { FireteamMemberView } from '~/lib/fireteam-sessions';

import {
  FireteamContext,
  type FireteamContextValue,
  FireteamMemberProvider,
} from './fireteam-context';
import {
  ActiveMemberSession,
  InactiveMemberSession,
  MemberSessionStatus,
  type SessionData,
} from './member-session-status';

const mockPendingSession: SessionData = {
  id: 'sess-123',
  userId: 'user-1',
  characterId: 'char-100',
  name: 'PvP Trials Grind',
  status: 'pending',
  aggregateIds: ['g1', 'g2', 'g3'],
};

const mockMember: FireteamMember = {
  id: 'user-1',
  membershipId: 'mem-1',
  displayName: 'GuardianOne',
  characters: [],
};

function renderWithContext(viewOverrides: Partial<FireteamMemberView> = {}) {
  const view: FireteamMemberView = {
    member: mockMember,
    memberKey: 'user-1',
    savedCharId: 'char-100',
    effectiveCharId: 'char-100',
    activeSessions: [],
    isSelectedCharActive: false,
    hasAnyActive: false,
    isReadyToStart: true,
    isSelectedForBulk: true,
    ...viewOverrides,
  };

  const ctx: FireteamContextValue = {
    memberViews: [view],
    memberNames: { 'user-1': 'GuardianOne' },
    selectedTargets: [],
    readyCount: 1,
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
  };

  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <FireteamContext.Provider value={ctx}>
          <FireteamMemberProvider view={view}>
            <MemberSessionStatus />
          </FireteamMemberProvider>
        </FireteamContext.Provider>
      ),
    },
  ]);

  return render(<RouterProvider router={router} />);
}

describe('ActiveMemberSession', () => {
  it('renders active session badge, title, games count and link when status is pending', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <ActiveMemberSession
            session={mockPendingSession}
            userId="user-1"
            characterId="char-100"
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Active Session')).toBeInTheDocument();
    expect(screen.getByText('PvP Trials Grind')).toBeInTheDocument();
    expect(screen.getByText('3 games')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /view live session/i });
    expect(link).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-100/sessions/sess-123',
    );
  });

  it('renders starting Competitive division on active fireteam member session when compTracking is enabled', () => {
    const activeCompSession: SessionData = {
      ...mockPendingSession,
      compTracking: {
        enabled: true,
        start: {
          divisionName: 'Adept II',
          points: 7640,
          stepIndex: 27,
        },
      },
    };

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <ActiveMemberSession
            session={activeCompSession}
            userId="user-1"
            characterId="char-100"
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Comp')).toBeInTheDocument();
    expect(screen.getByText(/Adept II/)).toBeInTheDocument();
    expect(screen.getByText('(7,640)')).toBeInTheDocument();
  });

  it('renders active session from GET /fireteam without aggregateIds using startedAt and trackComp', () => {
    const lightweightSession: SessionData = {
      id: 'sess-ft-1',
      userId: 'user-1',
      characterId: 'char-100',
      status: 'pending',
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
      trackComp: true,
    };

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <ActiveMemberSession
            session={lightweightSession}
            bulkOutcome="started"
            userId="user-1"
            characterId="char-100"
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Active Session')).toBeInTheDocument();
    expect(screen.getByText(/Started .* ago/i)).toBeInTheDocument();
    expect(screen.queryByText(/0 games/i)).not.toBeInTheDocument();
    expect(screen.getByText('Comp')).toBeInTheDocument();
    expect(screen.getByText('Tracking')).toBeInTheDocument();
    expect(screen.getByText('Started via Fireteam')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view live session/i }),
    ).toHaveAttribute('href', '/profile/user-1/c/char-100/sessions/sess-ft-1');
  });
});

describe('InactiveMemberSession', () => {
  it('renders inactive status and opens StartSessionDialog when Start a Session is clicked', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <InactiveMemberSession userId="user-1" characterId="char-100" />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
    const startButton = screen.getByRole('button', {
      name: /start a session/i,
    });
    expect(startButton).toBeInTheDocument();

    fireEvent.click(startButton);

    expect(
      screen.getByRole('checkbox', { name: /track competitive score/i }),
    ).toBeInTheDocument();
  });

  it('renders link to active session on another character when selected character is inactive', () => {
    const otherActive: SessionData = {
      id: 'sess-warlock',
      userId: 'user-1',
      characterId: 'char-warlock',
      status: 'pending',
    };

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <InactiveMemberSession
            otherActiveSession={otherActive}
            otherActiveCharacterClass="Warlock"
            userId="user-1"
            characterId="char-hunter"
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Active session on Warlock')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^view$/i })).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-warlock/sessions/sess-warlock',
    );
  });
});

describe('MemberSessionStatus', () => {
  it('delegates to ActiveMemberSession when selectedActiveSession is pending in context', () => {
    renderWithContext({
      selectedActiveSession: mockPendingSession,
      isSelectedCharActive: true,
    });

    expect(screen.getByText('Active Session')).toBeInTheDocument();
    expect(screen.getByText('PvP Trials Grind')).toBeInTheDocument();
  });

  it('delegates to InactiveMemberSession when selected character has no active session', () => {
    renderWithContext({ selectedActiveSession: undefined });

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
