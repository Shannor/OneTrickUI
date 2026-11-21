import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Session } from '~/api';

import { SessionCard } from './session-card';

const mockCompletedSession: Session = {
  id: 'sess-1',
  userId: 'user-1',
  characterId: 'char-1',
  name: 'Competitive Grind',
  description: 'Road to Ascendant',
  startedAt: new Date('2024-08-29T10:00:00Z'),
  completedAt: new Date('2024-08-29T12:00:00Z'),
  status: 'complete',
  aggregateIds: ['agg-1', 'agg-2', 'agg-3', 'agg-4', 'agg-5'],
  summary: {
    totalMatches: 5,
    wins: 3,
    losses: 2,
    winRate: 0.6,
    kills: 45,
    deaths: 25,
    assists: 15,
    kdRatio: 1.8,
    kdaRatio: 2.4,
    modesPlayed: ['Competitive', 'Control'],
    topWeapons: [
      { name: 'Rose', icon: '/img/rose.png', kills: 25 },
      { name: 'Matador 64', icon: '/img/matador.png', kills: 12 },
    ],
  },
};

const mockLegacySession: Session = {
  id: 'sess-2',
  userId: 'user-1',
  characterId: 'char-1',
  name: 'Legacy Session',
  startedAt: new Date('2024-08-28T10:00:00Z'),
  status: 'complete',
  aggregateIds: ['agg-1', 'agg-2'],
};

const mockActiveSession: Session = {
  id: 'sess-3',
  userId: 'user-1',
  characterId: 'char-1',
  name: 'Live Trials Run',
  startedAt: new Date(),
  status: 'pending',
  aggregateIds: [],
};

describe('SessionCard', () => {
  it('renders session summary metrics when summary data is present', () => {
    const handleClick = vi.fn();
    render(
      <SessionCard session={mockCompletedSession} onClick={handleClick} />,
    );

    expect(screen.getByText('Competitive Grind')).toBeInTheDocument();
    expect(screen.getByText('Road to Ascendant')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();

    expect(screen.getByText('Matches')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('(3W - 2L)')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('1.80')).toBeInTheDocument();
    expect(screen.getByText('(2.40 KDA)')).toBeInTheDocument();

    expect(screen.getByText('Competitive')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();

    expect(screen.getByText('Rose')).toBeInTheDocument();
    expect(screen.getByText('(25)')).toBeInTheDocument();
  });

  it('renders fallback games logged when summary data is not present', () => {
    const handleClick = vi.fn();
    render(<SessionCard session={mockLegacySession} onClick={handleClick} />);

    expect(screen.getByText('Legacy Session')).toBeInTheDocument();
    expect(screen.getByText('Matches:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders active badge for pending status', () => {
    const handleClick = vi.fn();
    render(<SessionCard session={mockActiveSession} onClick={handleClick} />);

    expect(screen.getByText('Live Trials Run')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('View Active Session')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <SessionCard session={mockCompletedSession} onClick={handleClick} />,
    );

    const card = screen.getByText('Competitive Grind').closest('.group');
    expect(card).toBeInTheDocument();
    if (card) {
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('renders starting Competitive division, icon, and points for active sessions with compTracking enabled', () => {
    const activeCompSession: Session = {
      ...mockActiveSession,
      compTracking: {
        enabled: true,
        start: {
          divisionName: 'Platinum III',
          points: 5820,
          stepIndex: 21,
          icon: '/common/destiny2_content/icons/plat3.png',
        },
      },
    };

    render(<SessionCard session={activeCompSession} onClick={vi.fn()} />);

    expect(screen.getByText('Tracking Competitive')).toBeInTheDocument();
    expect(
      screen.getByText('Start: Platinum III · 5,820 pts'),
    ).toBeInTheDocument();
    const divisionImg = screen.getByAltText('Platinum III');
    expect(divisionImg).toHaveAttribute(
      'src',
      'https://www.bungie.net/common/destiny2_content/icons/plat3.png',
    );
  });

  it('renders start -> end Competitive progression, promotion badge, and positive pointDelta for completed sessions', () => {
    const completedCompSession: Session = {
      ...mockCompletedSession,
      compTracking: {
        enabled: true,
        start: {
          divisionName: 'Platinum III',
          points: 5820,
          stepIndex: 21,
          icon: '/common/destiny2_content/icons/plat3.png',
        },
        end: {
          divisionName: 'Platinum II',
          points: 6045,
          stepIndex: 22,
          icon: '/common/destiny2_content/icons/plat2.png',
        },
        pointDelta: 225,
      },
    };

    render(<SessionCard session={completedCompSession} onClick={vi.fn()} />);

    expect(screen.getByText('(5,820)')).toBeInTheDocument();
    expect(screen.getByText('(6,045)')).toBeInTheDocument();
    expect(screen.getByText('Promoted')).toBeInTheDocument();
    expect(screen.getByText('+225 pts')).toBeInTheDocument();
  });

  it('renders negative pointDelta and Relegated badge when division drops', () => {
    const relegatedSession: Session = {
      ...mockCompletedSession,
      compTracking: {
        enabled: true,
        start: {
          divisionName: 'Platinum III',
          points: 5510,
          stepIndex: 21,
        },
        end: {
          divisionName: 'Gold I',
          points: 5400,
          stepIndex: 20,
        },
        pointDelta: -110,
      },
    };

    render(<SessionCard session={relegatedSession} onClick={vi.fn()} />);

    expect(screen.getByText('Relegated')).toBeInTheDocument();
    expect(screen.getByText('-110 pts')).toBeInTheDocument();
  });

  it('handles completed session when end snapshot is still pending gracefully', () => {
    const finalizingSession: Session = {
      ...mockCompletedSession,
      compTracking: {
        enabled: true,
        start: {
          divisionName: 'Platinum III',
          points: 5820,
        },
      },
    };

    render(<SessionCard session={finalizingSession} onClick={vi.fn()} />);

    expect(
      screen.getByText('Start: Platinum III · 5,820 pts'),
    ).toBeInTheDocument();
    expect(screen.getByText(/finalizing rank/i)).toBeInTheDocument();
  });
});
