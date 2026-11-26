import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FireteamContext, type FireteamContextValue } from './fireteam-context';
import { StartFireteamBar, getBulkStartStatusText } from './start-fireteam-bar';

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

function renderBar(
  overrides: Partial<FireteamContextValue> = {},
  children?: ReactNode,
) {
  const value = makeContextValue(overrides);
  render(
    <FireteamContext.Provider value={value}>
      <StartFireteamBar>{children}</StartFireteamBar>
    </FireteamContext.Provider>,
  );
  return value;
}

describe('getBulkStartStatusText', () => {
  it('returns distinct status copy for all-active, none-selected, mixed, and ready-only states', () => {
    expect(
      getBulkStartStatusText({
        readyCount: 0,
        selectedCount: 0,
        activeCount: 3,
      }),
    ).toBe('All teammates are actively tracking a session.');
    expect(
      getBulkStartStatusText({
        readyCount: 2,
        selectedCount: 0,
        activeCount: 1,
      }),
    ).toBe('Select at least one inactive teammate below to start.');
    expect(
      getBulkStartStatusText({
        readyCount: 2,
        selectedCount: 2,
        activeCount: 1,
      }),
    ).toBe('2 selected to start · 1 already tracking (skipped)');
    expect(
      getBulkStartStatusText({
        readyCount: 1,
        selectedCount: 1,
        activeCount: 0,
      }),
    ).toBe('1 teammate ready to start');
    expect(
      getBulkStartStatusText({
        readyCount: 2,
        selectedCount: 2,
        activeCount: 0,
      }),
    ).toBe('2 teammates ready to start');
  });
});

describe('StartFireteamBar', () => {
  it('renders mixed fireteam counts, trackComp toggle, and invokes submitBulkStart on click', () => {
    const ctx = renderBar({
      selectedTargets: [
        { userId: 'u2', characterId: 'c2' },
        { userId: 'u3', characterId: 'c3' },
      ],
      readyCount: 2,
      activeSelectedCount: 1,
      trackComp: false,
    });

    expect(
      screen.getByText('2 selected to start · 1 already tracking (skipped)'),
    ).toBeInTheDocument();

    const compToggle = screen.getByRole('checkbox', {
      name: /track competitive score/i,
    });
    fireEvent.click(compToggle);
    expect(ctx.setTrackComp).toHaveBeenCalledWith(true);

    const startButton = screen.getByRole('button', {
      name: /start fireteam \(2\)/i,
    });
    expect(startButton).not.toBeDisabled();
    fireEvent.click(startButton);
    expect(ctx.submitBulkStart).toHaveBeenCalledTimes(1);
  });

  it('disables controls and displays all-active copy when no members need starting', () => {
    renderBar({
      selectedTargets: [],
      readyCount: 0,
      activeSelectedCount: 3,
    });

    expect(
      screen.getByText('All teammates are actively tracking a session.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /start fireteam/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: /track competitive score/i }),
    ).toBeDisabled();
  });

  it('renders composed children inside the bar section', () => {
    renderBar({}, <div data-testid="custom-slot">Slot content</div>);
    expect(screen.getByTestId('custom-slot')).toHaveTextContent('Slot content');
  });
});
