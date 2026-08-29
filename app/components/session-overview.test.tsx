import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Aggregate, CharacterSnapshot, Session } from '~/api';

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

const mockSnapshot = {
  id: 'snap-1',
  name: 'Solar Hunter PvP',
  loadout: {
    3284755031: {
      itemHash: 3284755031n,
      name: 'Solar Hunter',
      details: {
        baseInfo: {
          name: 'Solar Hunter',
          icon: '/solar.png',
          tierTypeName: 'Basic',
        },
        sockets: [
          {
            itemTypeDisplayName: 'Super',
            isVisible: true,
            isEnabled: true,
            name: 'Golden Gun',
            icon: '/goldengun.png',
          },
        ],
      },
    },
    3448274439: {
      instanceId: 'helm-1',
      itemHash: 3448274439n,
      details: {
        baseInfo: {
          name: 'Knucklehead Radar',
          icon: '/knucklehead.png',
          tierTypeName: 'Exotic',
        },
        sockets: [],
        stats: {
          Mobility: { name: 'Mobility', value: 20, hash: 1 },
          Recovery: { name: 'Recovery', value: 15, hash: 2 },
        },
      },
    },
  },
  stats: {
    Mobility: { name: 'Mobility', value: 80 },
    Resilience: { name: 'Resilience', value: 100 },
  },
} as unknown as CharacterSnapshot;

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
        snapshots={{ 'snap-1': mockSnapshot }}
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

  it('renders performance graph wrapper and class armor details', () => {
    render(
      <SessionOverview
        session={mockSession}
        aggregates={[mockAggregate]}
        snapshots={{ 'snap-1': mockSnapshot }}
        characterId="char-1"
      />,
    );

    expect(screen.getByText('Session Performance Graph')).toBeInTheDocument();
    expect(screen.getByText('Class & Armor Loadout')).toBeInTheDocument();
    expect(screen.getByText('Solar Hunter')).toBeInTheDocument();
    expect(screen.getByText('Class Stats Overview')).toBeInTheDocument();
    expect(screen.getByText('Armor Pieces & Mods')).toBeInTheDocument();
  });
});
