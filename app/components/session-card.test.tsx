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
});
