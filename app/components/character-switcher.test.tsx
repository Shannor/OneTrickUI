import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Character } from '~/api';

import {
  CharacterSwitcher,
  getCharacterStackOrder,
} from './character-switcher';

const MOCK_CHARACTERS: Character[] = [
  {
    id: 'char-1',
    class: 'Hunter',
    race: 'Human',
    light: 545n,
    emblemURL: '/hunter-emblem.png',
    emblemBackgroundURL: '/hunter-bg.png',
    emblemColor: { red: 40, green: 20, blue: 20, alpha: 255 },
    currentTitle: 'Iron Lord',
  },
  {
    id: 'char-2',
    class: 'Warlock',
    race: 'Awoken',
    light: 68n,
    emblemURL: '/warlock-emblem.png',
    emblemBackgroundURL: '/warlock-bg.png',
    emblemColor: { red: 20, green: 30, blue: 40, alpha: 255 },
    currentTitle: 'Iron Lord',
  },
  {
    id: 'char-3',
    class: 'Titan',
    race: 'Awoken',
    light: 53n,
    emblemURL: '/titan-emblem.png',
    emblemBackgroundURL: '/titan-bg.png',
    emblemColor: { red: 30, green: 30, blue: 30, alpha: 255 },
    currentTitle: 'Conqueror',
  },
];

describe('getCharacterStackOrder', () => {
  it('rotates characters so the active Guardian leads and inactive Guardians follow in cycle order', () => {
    const order = getCharacterStackOrder(MOCK_CHARACTERS, 'char-2');
    expect(order.active?.id).toBe('char-2');
    expect(order.inactive.map((char) => char.id)).toEqual(['char-3', 'char-1']);
  });
});

describe('CharacterSwitcher', () => {
  it('renders the active Guardian banner and stepped crest links for inactive Guardians', () => {
    render(
      <MemoryRouter>
        <CharacterSwitcher
          characters={MOCK_CHARACTERS}
          activeCharacterId="char-1"
          buildCharacterHref={(id) => `/profile/u1/c/${id}/loadouts`}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Hunter' })).toBeInTheDocument();
    expect(screen.getByText('545')).toBeInTheDocument();

    const warlockTab = screen.getByRole('link', {
      name: 'Switch to Warlock (68)',
    });
    expect(warlockTab).toHaveAttribute('href', '/profile/u1/c/char-2/loadouts');

    const titanTab = screen.getByRole('link', {
      name: 'Switch to Titan (53)',
    });
    expect(titanTab).toHaveAttribute('href', '/profile/u1/c/char-3/loadouts');
  });

  it('opens the Guardian swap popover when clicking Swap Guardian', () => {
    render(
      <MemoryRouter>
        <CharacterSwitcher
          characters={MOCK_CHARACTERS}
          activeCharacterId="char-1"
          buildCharacterHref={(id) => `/profile/u1/c/${id}`}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Swap Guardian' }));

    expect(screen.getByText('Switch Guardian')).toBeInTheDocument();
    expect(screen.getByText('3 Guardians')).toBeInTheDocument();
    expect(screen.getByText('Warlock')).toBeInTheDocument();
    expect(screen.getByText('Titan')).toBeInTheDocument();
  });

  it('hides the Swap trigger and crest tabs when the profile has only one Guardian', () => {
    render(
      <MemoryRouter>
        <CharacterSwitcher
          characters={[MOCK_CHARACTERS[0]]}
          activeCharacterId="char-1"
          buildCharacterHref={(id) => `/profile/u1/c/${id}`}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Hunter' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Swap Guardian' }),
    ).not.toBeInTheDocument();
  });
});
