import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { FireteamMember } from '~/api';
import type { FireteamMemberView } from '~/lib/fireteam-sessions';

import { FireteamContext, type FireteamContextValue } from './fireteam-context';
import {
  FireteamMemberCard,
  MemberCardHeader,
  MemberCharacterForm,
} from './fireteam-member-card';
import { FireteamMemberProvider } from './fireteam-member-context';
import { MemberSessionStatus } from './member-session-status';

const mockMember: FireteamMember = {
  id: 'user-10',
  membershipId: 'mem-10',
  displayName: 'TitanLeader',
  characters: [
    {
      id: 'char-titan',
      class: 'Titan',
      race: 'Awoken',
      light: BigInt(2020),
      emblemURL: '/logo.svg',
      emblemBackgroundURL: '/bg.svg',
      currentTitle: 'Iron Lord',
      emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
    },
  ],
};

function makeMemberView(
  overrides: Partial<FireteamMemberView> = {},
): FireteamMemberView {
  return {
    member: mockMember,
    memberKey: 'user-10',
    savedCharId: 'char-titan',
    effectiveCharId: 'char-titan',
    activeSessions: [],
    isSelectedCharActive: false,
    hasAnyActive: false,
    isReadyToStart: true,
    isSelectedForBulk: true,
    ...overrides,
  };
}

function renderCard(
  viewOverrides: Partial<FireteamMemberView> = {},
  ctxOverrides: Partial<FireteamContextValue> = {},
) {
  const view = makeMemberView(viewOverrides);
  const ctx: FireteamContextValue = {
    memberViews: [view],
    memberNames: { 'user-10': 'TitanLeader' },
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
    ...ctxOverrides,
  };

  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <FireteamContext.Provider value={ctx}>
          <FireteamMemberProvider view={view}>
            <FireteamMemberCard>
              <div className="flex flex-col gap-4">
                <MemberCardHeader />
                <MemberCharacterForm />
              </div>
              <MemberSessionStatus />
            </FireteamMemberCard>
          </FireteamMemberProvider>
        </FireteamContext.Provider>
      ),
    },
  ]);

  render(<RouterProvider router={router} />);
  return ctx;
}

describe('FireteamMemberCard', () => {
  it('renders member header and character picker without raw user ID', () => {
    renderCard();

    expect(screen.getByText('TitanLeader')).toBeInTheDocument();
    expect(screen.queryByText(/ID:/i)).not.toBeInTheDocument();
    expect(screen.getByText('Titan')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('Iron Lord')).toBeInTheDocument();
  });

  it('renders Active Session status and hides bulk checkbox when selected character is active', () => {
    renderCard({
      isSelectedCharActive: true,
      hasAnyActive: true,
      isReadyToStart: false,
      isSelectedForBulk: false,
      selectedActiveSession: {
        id: 'sess-active-99',
        userId: 'user-10',
        characterId: 'char-titan',
        status: 'pending',
        startedAt: new Date('2026-11-25T00:00:00Z'),
      },
    });

    expect(screen.getByText('Active Session')).toBeInTheDocument();
    expect(screen.queryByText('Tracking')).not.toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view live session/i }),
    ).toHaveAttribute(
      'href',
      '/profile/user-10/c/char-titan/sessions/sess-active-99',
    );
    expect(
      screen.queryByRole('checkbox', { name: /include titanleader/i }),
    ).not.toBeInTheDocument();
  });

  it('renders bulk selection checkbox for inactive members and calls toggleMemberBulkSelect', () => {
    const ctx = renderCard({ isSelectedForBulk: true });

    const checkbox = screen.getByRole('checkbox', {
      name: /include titanleader in fireteam start/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(ctx.toggleMemberBulkSelect).toHaveBeenCalledWith('user-10', false);
  });
});
