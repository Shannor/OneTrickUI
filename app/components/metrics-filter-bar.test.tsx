import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MetricsFilterBar } from './metrics-filter-bar';

describe('MetricsFilterBar', () => {
  it('renders date range preset and invokes game mode callback when pill is clicked', () => {
    const onTimeChange = vi.fn();
    const onGameModeChange = vi.fn();

    render(
      <MetricsFilterBar
        time="all-time"
        onTimeChange={onTimeChange}
        gameMode="allGameModes"
        onGameModeChange={onGameModeChange}
      />,
    );

    expect(screen.getByText('All Time')).toBeInTheDocument();

    const trialsButton = screen.getByRole('button', { name: 'Trials' });
    fireEvent.click(trialsButton);

    expect(onGameModeChange).toHaveBeenCalledWith('trials');
  });
});
