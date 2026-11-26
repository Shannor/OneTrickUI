import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FireteamMemberView } from '~/lib/fireteam-sessions';

import { FireteamContext, type FireteamContextValue } from './fireteam-context';
import { FireteamHeader } from './fireteam-header';

function renderHeader(memberCount: number, activeHeaderCount = 0) {
  const memberViews = Array.from(
    { length: memberCount },
    (_, i) =>
      ({
        memberKey: `u-${i}`,
      }) as FireteamMemberView,
  );

  const value: FireteamContextValue = {
    memberViews,
    memberNames: {},
    selectedTargets: [],
    readyCount: memberCount - activeHeaderCount,
    activeHeaderCount,
    activeSelectedCount: activeHeaderCount,
    trackComp: false,
    setTrackComp: vi.fn(),
    isBulkSubmitting: false,
    isSubmitting: false,
    submitBulkStart: vi.fn(),
    dismissResults: vi.fn(),
    toggleMemberBulkSelect: vi.fn(),
    selectMemberCharacter: vi.fn(),
  };

  return render(
    <FireteamContext.Provider value={value}>
      <FireteamHeader />
    </FireteamContext.Provider>,
  );
}

describe('FireteamHeader', () => {
  it('renders title and description', () => {
    renderHeader(3);

    expect(screen.getByText('Fireteam Overview')).toBeInTheDocument();
    expect(
      screen.getByText(
        /View your current 1 Trick fireteam, manage active Guardians/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders plural teammate count badge correctly', () => {
    renderHeader(3);
    expect(screen.getByText('3 Teammates')).toBeInTheDocument();
  });

  it('renders singular teammate count badge correctly', () => {
    renderHeader(1);
    expect(screen.getByText('1 Teammate')).toBeInTheDocument();
    expect(screen.queryByText(/Active/)).not.toBeInTheDocument();
  });

  it('renders active count badge when activeHeaderCount is greater than zero', () => {
    renderHeader(3, 2);
    expect(screen.getByText('3 Teammates')).toBeInTheDocument();
    expect(screen.getByText('2 Active')).toBeInTheDocument();
  });
});
