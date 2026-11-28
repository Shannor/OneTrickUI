import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
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
  it('renders Victory card with native game details link, composed slot, and card click handler', () => {
    const onSelect = vi.fn();

    render(
      <MemoryRouter>
        <SessionMatchCard
          aggregate={makeAggregate(0)}
          characterId="char-1"
          activityPath="/profile/u-1/c/char-1/sessions/s-1/activities/inst-1"
          onSelect={onSelect}
        >
          <div>Fireteam Companion Slot</div>
        </SessionMatchCard>
      </MemoryRouter>,
    );

    const heading = screen.getByRole('heading', { name: 'Burnout' });
    expect(heading).toBeInTheDocument();
    expect(screen.getAllByText('VICTORY').length).toBeGreaterThan(0);
    expect(screen.getByText('2.00')).toBeInTheDocument();
    expect(screen.getByText('2.67')).toBeInTheDocument();
    expect(screen.getByText('Fireteam Companion Slot')).toBeInTheDocument();

    const detailsLink = screen.getByRole('link', { name: 'View Game Details' });
    expect(detailsLink).toHaveAttribute(
      'href',
      '/profile/u-1/c/char-1/sessions/s-1/activities/inst-1',
    );
    fireEvent.click(detailsLink);
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.click(heading);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders Defeat banner when standing is non-zero', () => {
    render(
      <MemoryRouter>
        <SessionMatchCard
          aggregate={makeAggregate(1)}
          characterId="char-1"
          activityPath="/profile/u-1/c/char-1/activities/inst-1"
          onSelect={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('DEFEAT').length).toBeGreaterThan(0);
  });
});
