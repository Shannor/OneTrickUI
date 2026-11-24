import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GAME_MODE_OPTIONS, GameModeSelector } from './game-mode-selector';

describe('GameModeSelector', () => {
  it('renders all game mode pill options with active aria-pressed state', () => {
    render(
      <GameModeSelector value="competitive" onValueChange={vi.fn()} />,
    );

    const group = screen.getByRole('group', { name: /filter by game mode/i });
    expect(group).toBeInTheDocument();

    for (const option of GAME_MODE_OPTIONS) {
      const button = screen.getByRole('button', { name: option.label });
      expect(button).toHaveAttribute(
        'aria-pressed',
        option.value === 'competitive' ? 'true' : 'false',
      );
    }

    expect(
      screen.getByRole('combobox', { name: /game mode/i }),
    ).toBeInTheDocument();
  });

  it('calls onValueChange with selected game mode when a pill is clicked', () => {
    const onValueChange = vi.fn();

    render(
      <GameModeSelector value="allGameModes" onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trials' }));
    expect(onValueChange).toHaveBeenCalledWith('trials');

    fireEvent.click(screen.getByRole('button', { name: 'Iron Banner' }));
    expect(onValueChange).toHaveBeenCalledWith('ironBanner');
  });
});
