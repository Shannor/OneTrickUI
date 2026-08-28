import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CharacterSnapshot } from '~/api';

import { CondensedLoadout } from './condensed-loadout';

describe('CondensedLoadout', () => {
  const mockSnapshot: CharacterSnapshot = {
    id: 'snap-1',
    characterId: 'char-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    hash: 'hash-1',
    name: 'PvP Setup',
    userId: 'user-1',
    stats: {
      Mobility: {
        name: 'Mobility',
        value: 80,
        icon: '',
        hasIcon: false,
        description: '',
        statCategory: 0,
        aggregationType: 0,
      },
      Resilience: {
        name: 'Resilience',
        value: 100,
        icon: '',
        hasIcon: false,
        description: '',
        statCategory: 0,
        aggregationType: 0,
      },
    },
    loadout: {},
  };

  it('renders class stats in condensed view', () => {
    render(<CondensedLoadout snapshot={mockSnapshot} />);

    expect(screen.getByText('Mobility')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('Resilience')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
