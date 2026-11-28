import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Aggregate } from '~/api';

import {
  SessionMatchCard,
  hasMatchLoadoutConfidence,
} from './session-match-card';

const makeAggregate = (standing: number): Aggregate =>
  ({
    id: 'agg-1',
    activityDetails: {
      instanceId: 'inst-1',
      activity: 'Trials of Osiris',
      mode: 'Trials of OsirisDominion',
      location: 'Burnout',
      period: new Date('2026-01-15T18:30:00Z'),
      imageUrl: '/map.jpg',
      activityIcon: '/icon.png',
    },
    snapshotLinks: {},
    performance: {
      'char-1': {
        playerStats: {
          kills: { value: 12 },
          assists: { value: 4 },
          deaths: { value: 6 },
          standing: { value: standing },
        },
      },
    },
  }) as unknown as Aggregate;

describe('hasMatchLoadoutConfidence', () => {
  it('returns true for high, medium, and low confidence levels', () => {
    expect(hasMatchLoadoutConfidence('high')).toBe(true);
    expect(hasMatchLoadoutConfidence('medium')).toBe(true);
    expect(hasMatchLoadoutConfidence('low')).toBe(true);
    expect(hasMatchLoadoutConfidence('notFound')).toBe(false);
    expect(hasMatchLoadoutConfidence(undefined)).toBe(false);
  });
});

describe('SessionMatchCard', () => {
  it('renders Victory card with stats, composed children slot, and triggers onSelect on click', () => {
    const onSelect = vi.fn();

    render(
      <SessionMatchCard
        aggregate={makeAggregate(0)}
        characterId="char-1"
        onSelect={onSelect}
      >
        <div>Fireteam Companion Slot</div>
      </SessionMatchCard>,
    );

    expect(
      screen.getByRole('heading', { name: 'Burnout' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('VICTORY').length).toBeGreaterThan(0);
    expect(screen.getByText('2.00')).toBeInTheDocument();
    expect(screen.getByText('2.67')).toBeInTheDocument();
    expect(screen.getByText('Fireteam Companion Slot')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View Game Details' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders Defeat banner when standing is non-zero', () => {
    render(
      <SessionMatchCard
        aggregate={makeAggregate(1)}
        characterId="char-1"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getAllByText('DEFEAT').length).toBeGreaterThan(0);
  });
});
