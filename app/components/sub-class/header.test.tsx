import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CharacterSnapshot } from '~/api';
import { TooltipProvider } from '~/components/ui/tooltip';
import { SubClassProvider } from '~/providers/sub-class-provider';
import { SubClassHeader } from './header';

describe('SubClassHeader', () => {
  const mockSnapshot: CharacterSnapshot = {
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
        name: 'Solar',
        details: {
          baseInfo: {} as any,
          perks: [] as any,
          stats: {} as any,
          sockets: [
            {
              itemTypeDisplayName: 'Solar Super',
              isVisible: true,
              isEnabled: true,
              name: 'Blade Barrage',
              plugHash: 0n as any,
              description: '',
            },
          ],
        },
      },
    },
  };

  it('renders subclass name and toggle show more button', () => {
    const onToggle = vi.fn();
    render(
      <TooltipProvider>
        <SubClassProvider snapshot={mockSnapshot}>
          <SubClassHeader showMore={false} onToggleShowMore={onToggle} />
        </SubClassProvider>
      </TooltipProvider>,
    );

    expect(screen.getByText('Solar')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show details/i }),
    ).toBeInTheDocument();
  });
});
