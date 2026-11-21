import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Aggregate, Session } from '~/api';

import { SessionOverview } from './session-overview';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

const mockSession: Session = {
  id: 'sess-123',
  userId: 'user-1',
  characterId: 'char-1',
  name: 'Competitive Session',
  description: 'Road to Ascendant',
  startedAt: new Date('2024-08-29T10:00:00Z'),
  completedAt: new Date('2024-08-29T12:00:00Z'),
  status: 'complete',
  aggregateIds: ['agg-1'],
};

const mockAggregate = {
  id: 'agg-1',
  sessionId: 'sess-123',
  activityDetails: {
    instanceId: 'inst-1',
    activity: 'Competitive',
    location: 'Javelin-4',
    period: new Date('2024-08-29T10:30:00Z'),
    imageUrl: '/jav.png',
    activityIcon: '/comp.png',
  },
  snapshotLinks: {
    'char-1': {
      snapshotId: 'snap-1',
      confidenceLevel: 'high',
    },
  },
  performance: {
    'char-1': {
      playerStats: {
        kills: { value: 20 },
        deaths: { value: 10 },
        assists: { value: 5 },
        standing: { value: 0 },
      },
      weapons: {},
    },
  },
} as unknown as Aggregate;

describe('SessionOverview', () => {
  it('renders overall session stat metrics correctly', () => {
    render(
      <SessionOverview
        session={mockSession}
        aggregates={[mockAggregate]}
        characterId="char-1"
      />,
    );

    expect(screen.getByText('Matches')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('(1W - 0L)')).toBeInTheDocument();

    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    expect(screen.getByText('K / D')).toBeInTheDocument();
    expect(screen.getByText('2.00')).toBeInTheDocument();

    expect(screen.getByText('Efficiency')).toBeInTheDocument();
    expect(screen.getByText('2.50')).toBeInTheDocument();
  });

  it('renders performance graph wrapper without class or armor loadout details', () => {
    render(
      <SessionOverview
        session={mockSession}
        aggregates={[mockAggregate]}
        characterId="char-1"
      />,
    );

    expect(screen.getByText('Session Performance Graph')).toBeInTheDocument();
    expect(
      screen.queryByText('Class & Armor Loadout'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Class Stats Overview'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Armor Pieces & Mods'),
    ).not.toBeInTheDocument();
  });

  it('renders Tracking Competitive status and starting division on active sessions with compTracking', () => {
    const activeCompSession: Session = {
      ...mockSession,
      status: 'pending',
      compTracking: {
        enabled: true,
        start: {
          divisionName: 'Ascendant III',
          points: 8950,
          stepIndex: 25,
          icon: '/common/destiny2_content/icons/ascendant.png',
        },
      },
    };

    render(
      <SessionOverview
        session={activeCompSession}
        aggregates={[]}
        characterId="char-1"
      />,
    );

    expect(screen.getByText('Tracking Competitive')).toBeInTheDocument();
    expect(
      screen.getByText('Start: Ascendant III · 8,950 pts'),
    ).toBeInTheDocument();
  });

  it('renders start -> end rank progression and pointDelta on completed sessions with compTracking', () => {
    const completedCompSession: Session = {
      ...mockSession,
      status: 'complete',
      compTracking: {
        enabled: true,
        start: {
          divisionName: 'Platinum III',
          points: 5820,
          stepIndex: 21,
        },
        end: {
          divisionName: 'Platinum II',
          points: 6045,
          stepIndex: 22,
        },
        pointDelta: 225,
      },
    };

    render(
      <SessionOverview
        session={completedCompSession}
        aggregates={[mockAggregate]}
        characterId="char-1"
      />,
    );

    expect(screen.getByText('(5,820)')).toBeInTheDocument();
    expect(screen.getByText('(6,045)')).toBeInTheDocument();
    expect(screen.getByText('Promoted')).toBeInTheDocument();
    expect(screen.getByText('+225 pts')).toBeInTheDocument();
  });
});
