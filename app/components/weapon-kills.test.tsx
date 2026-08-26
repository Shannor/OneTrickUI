import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';

import { WeaponKills } from './weapon-kills';

describe('WeaponKills', () => {
  const mockStats = {
    uniqueWeaponKills: {
      basic: { displayValue: '42' },
    },
    uniqueWeaponPrecisionKills: {
      basic: { displayValue: '75%' },
    },
    uniqueWeaponKillsPrecisionKills: {
      basic: { displayValue: '65%' },
    },
  };

  it('renders metric values with tooltips', () => {
    render(
      <TooltipProvider>
        <WeaponKills stats={mockStats} />
      </TooltipProvider>,
    );
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });
});
