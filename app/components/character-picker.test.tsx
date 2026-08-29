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
    light: BigInt(2000),
    emblemURL: '/emblem1.png',
    emblemBackgroundURL: '/bg1.png',
    emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
    currentTitle: 'Flawless',
  },
  {
    id: 'char-2',
    class: 'Titan',
    race: 'Exo',
    light: BigInt(1990),
    emblemURL: '/emblem2.png',
    emblemBackgroundURL: '/bg2.png',
    emblemColor: { red: 0, green: 0, blue: 0, alpha: 1 },
    currentTitle: 'Conqueror',
  },
];

describe('CharacterPicker Component', () => {
  it('renders all characters when currentCharacterId is not provided', () => {
    const childrenSpy = vi.fn((current?: string | null) => (
      <button type="button" disabled={!current}>
        Pick a Guardian
      </button>
    ));

    render(
      <CharacterPicker characters={mockCharacters}>
        {childrenSpy}
      </CharacterPicker>,
    );

    expect(screen.getByText('Hunter')).toBeInTheDocument();
    expect(screen.getByText('Titan')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /pick a guardian/i });
    expect(button).toBeDisabled();

    fireEvent.click(screen.getByText('Hunter'));
    expect(childrenSpy).toHaveBeenLastCalledWith('char-1', undefined);
    expect(button).not.toBeDisabled();
  });

  it('hides change guardian button when not actively swapping, shows it during swap, and hides again on collapse', () => {
    const childrenSpy = vi.fn(
      (current?: string | null, previous?: string | null) => (
        <button disabled={!current || current === previous} type="submit">
          Change Guardian
        </button>
      ),
    );

    const { rerender } = render(
      <CharacterPicker characters={mockCharacters} currentCharacterId="char-1">
        {childrenSpy}
      </CharacterPicker>,
    );

    expect(screen.getByText('Hunter')).toBeInTheDocument();
    expect(screen.queryByText('Titan')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /change guardian/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /swap guardian/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /swap guardian/i }));

    expect(screen.getByText('Titan')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /change guardian/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /swap guardian/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Titan'));
    expect(childrenSpy).toHaveBeenLastCalledWith('char-2', 'char-1');

    rerender(
      <CharacterPicker characters={mockCharacters} currentCharacterId="char-2">
        {childrenSpy}
      </CharacterPicker>,
    );

    expect(screen.getByText('Titan')).toBeInTheDocument();
    expect(screen.queryByText('Hunter')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /change guardian/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /cancel/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /swap guardian/i }),
    ).toBeInTheDocument();
  });

  it('collapses back and resets selection when Cancel is clicked without changing character', () => {
    const childrenSpy = vi.fn(
      (current?: string | null, previous?: string | null) => (
        <button type="button" disabled={!current || current === previous}>
          Change Guardian
        </button>
      ),
    );

    render(
      <CharacterPicker characters={mockCharacters} currentCharacterId="char-1">
        {childrenSpy}
      </CharacterPicker>,
    );

    fireEvent.click(screen.getByRole('button', { name: /swap guardian/i }));
    expect(screen.getByText('Titan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByText('Hunter')).toBeInTheDocument();
    expect(screen.queryByText('Titan')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /change guardian/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /swap guardian/i }),
    ).toBeInTheDocument();
  });
});
