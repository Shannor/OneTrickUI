import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SessionCompanion } from '~/api';

import { EmptyFilteredMatches } from './empty-filtered-matches';

const alpha: SessionCompanion = {
  userId: 'user-a',
  displayName: 'Alpha',
  sharedMatches: 2,
  wins: 1,
  losses: 1,
  sessions: [],
};

const bravo: SessionCompanion = {
  userId: 'user-b',
  displayName: 'Bravo',
  sharedMatches: 1,
  wins: 1,
  losses: 0,
  sessions: [],
};

describe('EmptyFilteredMatches', () => {
  it('renders single-teammate copy for games context and calls onClearFilters', () => {
    const onClearFilters = vi.fn();

    render(
      <EmptyFilteredMatches
        selectedCompanions={[alpha]}
        onClearFilters={onClearFilters}
        context="games"
      />,
    );

    expect(screen.getByText('No Matches Found with Alpha')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Clear the teammate filter to view all matches in this session.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show All Matches' }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('renders multi-teammate intersection copy for metrics context', () => {
    render(
      <EmptyFilteredMatches
        selectedCompanions={[alpha, bravo]}
        onClearFilters={vi.fn()}
        context="metrics"
      />,
    );

    expect(
      screen.getByText('No Matches Found with Alpha & Bravo'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'No matches in this session included all selected teammates. Clear the filter to view metrics for all matches.',
      ),
    ).toBeInTheDocument();
  });
});
