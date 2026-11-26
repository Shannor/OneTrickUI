import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Stats } from '~/api';

import { WeaponStats } from './weapon-stats';

describe('WeaponStats', () => {
  it('renders compact stat pills in a 3-column grid sorted in Destiny stat order', () => {
    const nineStats: Stats = {
      '1931675084': {
        hash: 1931675084n as any,
        name: 'Ammo Generation',
        description: '',
        value: 56 as any,
      },
      '3555269338': {
        hash: 3555269338n as any,
        name: 'Zoom',
        description: '',
        value: 14 as any,
      },
      '4043523819': {
        hash: 4043523819n as any,
        name: 'Impact',
        description: '',
        value: 92 as any,
      },
      '1240592695': {
        hash: 1240592695n as any,
        name: 'Range',
        description: '',
        value: 87 as any,
      },
      '155624089': {
        hash: 155624089n as any,
        name: 'Stability',
        description: '',
        value: 56 as any,
      },
      '943549884': {
        hash: 943549884n as any,
        name: 'Handling',
        description: '',
        value: 31 as any,
      },
      '4188031367': {
        hash: 4188031367n as any,
        name: 'Reload Speed',
        description: '',
        value: 24 as any,
      },
      '1345609583': {
        hash: 1345609583n as any,
        name: 'Aim Assistance',
        description: '',
        value: 67 as any,
      },
      '2714457168': {
        hash: 2714457168n as any,
        name: 'Airborne Effectiveness',
        description: '',
        value: 21 as any,
      },
    };

    render(<WeaponStats stats={nineStats} compact={true} />);
    const grid = screen.getByTestId('weapon-stats-grid');
    expect(grid).toHaveClass('grid', 'grid-cols-3');
    expect(grid.children).toHaveLength(9);
    expect(grid.children[0]).toHaveTextContent('Impact92');
    expect(grid.children[1]).toHaveTextContent('Range87');
    expect(grid.children[8]).toHaveTextContent('A.G.56');
  });
});
