import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CharacterSnapshot } from '~/api';
import { TooltipProvider } from '~/components/ui/tooltip';
import { SubClassProvider } from '~/providers/sub-class-provider';

import { SubClassDetails } from './details';
import { SubClassHeader } from './header';

const makeSnapshot = (hasSockets: boolean): CharacterSnapshot => ({
  id: 'snap-1',
  name: 'Solar Build',
  userId: 'user-1',
  characterId: 'char-1',
  hash: 'hash-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  loadout: {
    3284755031: {
      itemHash: 3284755031n as any,
      instanceId: 0n as any,
      name: 'Gunslinger',
      details: {
        baseInfo: {
          name: 'Gunslinger',
          icon: '/solar.png',
        } as any,
        perks: [] as any,
        stats: {} as any,
        sockets: hasSockets
          ? [
              {
                itemTypeDisplayName: 'Solar Super',
                isVisible: true,
                isEnabled: true,
                name: 'Blade Barrage',
                icon: '/super.png',
                plugHash: 1n as any,
                description: 'Vault into the air.',
              },
            ]
          : undefined,
      } as any,
    },
  },
});

describe('SubClassDetails', () => {
  it('renders No Sockets Found empty state when subclass sockets are missing while SubClassHeader still renders name', () => {
    const missingSocketsSnapshot = makeSnapshot(false);

    render(
      <TooltipProvider>
        <SubClassProvider snapshot={missingSocketsSnapshot}>
          <SubClassHeader />
          <SubClassDetails />
        </SubClassProvider>
      </TooltipProvider>,
    );

    expect(screen.getByText('Gunslinger')).toBeInTheDocument();
    expect(screen.getByText('No Sockets Found')).toBeInTheDocument();
  });

  it('renders resolved super and ability groups when subclass sockets exist', () => {
    const populatedSnapshot = makeSnapshot(true);

    render(
      <TooltipProvider>
        <SubClassProvider snapshot={populatedSnapshot}>
          <SubClassDetails />
        </SubClassProvider>
      </TooltipProvider>,
    );

    expect(screen.queryByText('No Sockets Found')).not.toBeInTheDocument();
    expect(screen.getByText('Gunslinger')).toBeInTheDocument();
  });
});
