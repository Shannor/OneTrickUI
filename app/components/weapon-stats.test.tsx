import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Stats } from '~/api';
import { WeaponStats } from './weapon-stats';

describe('WeaponStats', () => {
  const mockStats: Stats = {
    '4043523819': {
      hash: 4043523819n as any,
      name: 'Impact',
      description: '',
      value: 80 as any,
    },
    '1240592695': {
      hash: 1240592695n as any,
      name: 'Range',
      description: '',
      value: 65 as any,
    },
  };

  it('renders compact stat pills by default', () => {
    render(<WeaponStats stats={mockStats} compact={true} />);
    expect(screen.getByText('Impact')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('Range')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
  });
});
