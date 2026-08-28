import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Character } from '~/api';

import { CharacterPicker } from './character-picker';

const mockCharacters: Character[] = [
  {
    id: 'char-1',
    class: 'Hunter',
    race: 'Human',
    light: 2000n,
    emblemURL: '/emblem1.png',
    emblemBackgroundURL: '/bg1.png',
    emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
    currentTitle: 'Flawless',
  },
  {
    id: 'char-2',
    class: 'Titan',
    race: 'Exo',
    light: 1990n,
    emblemURL: '/emblem2.png',
    emblemBackgroundURL: '/bg2.png',
    emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
    currentTitle: 'Conqueror',
  },
];

describe('CharacterPicker Component', () => {
  it('calls children render prop with undefined initial selection when currentCharacterId is not provided', () => {
    const childrenSpy = vi.fn((current?: string | null) => (
      <button disabled={!current}>Pick a Guardian</button>
    ));

    render(
      <CharacterPicker characters={mockCharacters}>
        {childrenSpy}
      </CharacterPicker>,
    );

    expect(childrenSpy).toHaveBeenCalledWith(undefined, undefined);
    const button = screen.getByRole('button', { name: /pick a guardian/i });
    expect(button).toBeDisabled();
  });

  it('updates selection and enables button when a character is clicked', () => {
    const childrenSpy = vi.fn((current?: string | null) => (
      <button disabled={!current}>Pick a Guardian</button>
    ));

    render(
      <CharacterPicker characters={mockCharacters}>
        {childrenSpy}
      </CharacterPicker>,
    );

    fireEvent.click(screen.getByText('Hunter'));

    expect(childrenSpy).toHaveBeenLastCalledWith('char-1', undefined);
    const button = screen.getByRole('button', { name: /pick a guardian/i });
    expect(button).not.toBeDisabled();
  });

  it('initializes selection when currentCharacterId is provided', () => {
    const childrenSpy = vi.fn(
      (current?: string | null, previous?: string | null) => (
        <button disabled={!current || current === previous}>
          {previous ? 'Change Guardian' : 'Pick a Guardian'}
        </button>
      ),
    );

    render(
      <CharacterPicker characters={mockCharacters} currentCharacterId="char-1">
        {childrenSpy}
      </CharacterPicker>,
    );

    expect(childrenSpy).toHaveBeenCalledWith('char-1', 'char-1');
    const button = screen.getByRole('button', { name: /change guardian/i });
    expect(button).toBeDisabled();

    fireEvent.click(screen.getByText('Titan'));

    expect(childrenSpy).toHaveBeenLastCalledWith('char-2', 'char-1');
    expect(button).not.toBeDisabled();
  });
});
