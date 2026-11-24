import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { CharacterLayout, buildCharacterSwitchHref } from './character-layout';

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => ({
    type: 'owner',
    profile: {
      id: 'user-123',
      displayName: 'TestGuardian',
      characters: [
        {
          id: 'char-1',
          class: 'Hunter',
          race: 'Human',
          light: 2000n,
          emblemURL: '/logo.svg',
          emblemBackgroundURL: '/hero-landing.svg',
          currentTitle: 'Flawless',
        },
        {
          id: 'char-2',
          class: 'Warlock',
          race: 'Awoken',
          light: 1995n,
          emblemURL: '/logo.svg',
          emblemBackgroundURL: '/hero-landing.svg',
          currentTitle: 'Conqueror',
        },
      ],
    },
  }),
}));

describe('buildCharacterSwitchHref', () => {
  it('preserves top-level loadouts, sessions, metrics, and fireteam sub-routes with search params', () => {
    expect(
      buildCharacterSwitchHref(
        'user-123',
        'char-1',
        'char-2',
        '/profile/user-123/c/char-1/loadouts',
        '?mode=trials',
      ),
    ).toBe('/profile/user-123/c/char-2/loadouts?mode=trials');

    expect(
      buildCharacterSwitchHref(
        'user-123',
        'char-1',
        'char-2',
        '/profile/user-123/c/char-1/sessions',
        '',
      ),
    ).toBe('/profile/user-123/c/char-2/sessions');

    expect(
      buildCharacterSwitchHref(
        'user-123',
        'char-1',
        'char-2',
        '/profile/user-123/c/char-1/metrics',
        '',
      ),
    ).toBe('/profile/user-123/c/char-2/metrics');
  });

  it('falls back to the character overview when switching from a nested detail page', () => {
    expect(
      buildCharacterSwitchHref(
        'user-123',
        'char-1',
        'char-2',
        '/profile/user-123/c/char-1/loadouts/loadout-99',
        '',
      ),
    ).toBe('/profile/user-123/c/char-2');
  });
});

describe('CharacterLayout', () => {
  it('renders the active character banner, stepped crest tab, and swap popover', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/profile/:id/c/:characterId',
          element: <CharacterLayout />,
        },
      ],
      {
        initialEntries: ['/profile/user-123/c/char-1'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: 'Hunter' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Switch to Warlock (1995)' }),
    ).toHaveAttribute('href', '/profile/user-123/c/char-2');

    fireEvent.click(screen.getByRole('button', { name: 'Swap Guardian' }));
    expect(screen.getByText('Warlock')).toBeInTheDocument();
  });
});
