import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { SessionCompanion } from '~/api';

import { SessionCompanionsBar } from './session-companions-bar';

const singleSessionCompanion: SessionCompanion = {
  userId: 'user-tragic',
  displayName: 'Tragic',
  sharedMatches: 3,
  wins: 2,
  losses: 1,
  sessions: [
    {
      sessionId: 'sess-tragic-1',
      characterId: 'char-tragic-titan',
      class: 'Titan',
      emblemUrl: '/img/titan.jpg',
      sharedMatches: 3,
    },
  ],
};

const multiSessionCompanion: SessionCompanion = {
  userId: 'user-swap',
  displayName: 'Swapper',
  sharedMatches: 4,
  wins: 3,
  losses: 1,
  sessions: [
    {
      sessionId: 'sess-swap-hunter',
      characterId: 'char-swap-hunter',
      class: 'Hunter',
      emblemUrl: '/img/hunter.jpg',
      sharedMatches: 3,
    },
    {
      sessionId: 'sess-swap-warlock',
      characterId: 'char-swap-warlock',
      class: 'Warlock',
      emblemUrl: '/img/warlock.jpg',
      sharedMatches: 1,
    },
  ],
};

function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter([{ path: '/', element: ui }]);
  return render(<RouterProvider router={router} />);
}

describe('SessionCompanionsBar', () => {
  it('renders nothing for solo sessions', () => {
    const { container } = renderWithRouter(
      <SessionCompanionsBar
        companions={[]}
        selectedUserIds={[]}
        onToggleCompanion={vi.fn()}
        onClearFilters={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('toggles teammate filter and renders direct session link for single-session companions', () => {
    const onToggleCompanion = vi.fn();

    renderWithRouter(
      <SessionCompanionsBar
        companions={[singleSessionCompanion]}
        totalMatches={6}
        selectedUserIds={[]}
        onToggleCompanion={onToggleCompanion}
        onClearFilters={vi.fn()}
      />,
    );

    const filterBtn = screen.getByRole('button', { name: /tragic/i });
    expect(filterBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('3/6 matches')).toBeInTheDocument();
    expect(screen.getByText('2W-1L')).toBeInTheDocument();

    fireEvent.click(filterBtn);
    expect(onToggleCompanion).toHaveBeenCalledWith('user-tragic');

    const sessionLink = screen.getByRole('link', {
      name: /view tragic's session \(titan\)/i,
    });
    expect(sessionLink).toHaveAttribute(
      'href',
      '/profile/user-tragic/c/char-tragic-titan/sessions/sess-tragic-1',
    );
  });

  it('supports multi-select AND filter state, displays combined summary, and clears filters', () => {
    const onToggleCompanion = vi.fn();
    const onClearFilters = vi.fn();

    renderWithRouter(
      <SessionCompanionsBar
        companions={[singleSessionCompanion, multiSessionCompanion]}
        totalMatches={6}
        filteredCount={2}
        selectedUserIds={['user-tragic', 'user-swap']}
        onToggleCompanion={onToggleCompanion}
        onClearFilters={onClearFilters}
      />,
    );

    const tragicBtn = screen.getByRole('button', { name: /tragic/i });
    const swapperBtn = screen.getByRole('button', {
      name: /swapper.*matches/i,
    });
    expect(tragicBtn).toHaveAttribute('aria-pressed', 'true');
    expect(swapperBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('2 of 6')).toBeInTheDocument();
    expect(screen.getByText('Tragic & Swapper')).toBeInTheDocument();

    fireEvent.click(tragicBtn);
    expect(onToggleCompanion).toHaveBeenCalledWith('user-tragic');

    fireEvent.click(screen.getByRole('button', { name: /clear filter/i }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('opens a multi-session popover listing every character session when a companion swapped characters', () => {
    renderWithRouter(
      <SessionCompanionsBar
        companions={[multiSessionCompanion]}
        totalMatches={6}
        selectedUserIds={[]}
        onToggleCompanion={vi.fn()}
        onClearFilters={vi.fn()}
      />,
    );

    const sessionsTrigger = screen.getByRole('button', {
      name: /view swapper's 2 sessions/i,
    });
    fireEvent.click(sessionsTrigger);

    const hunterLink = screen.getByRole('link', { name: /hunter/i });
    expect(hunterLink).toHaveAttribute(
      'href',
      '/profile/user-swap/c/char-swap-hunter/sessions/sess-swap-hunter',
    );
    const warlockLink = screen.getByRole('link', { name: /warlock/i });
    expect(warlockLink).toHaveAttribute(
      'href',
      '/profile/user-swap/c/char-swap-warlock/sessions/sess-swap-warlock',
    );
  });
});
