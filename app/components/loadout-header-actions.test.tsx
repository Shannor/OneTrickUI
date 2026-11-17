import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Loadout } from '~/api';
import { TooltipProvider } from '~/components/ui/tooltip';
import { HELMET_BUCKET, KINETIC_BUCKET } from '~/hooks/use-loadout';

import { LoadoutHeaderActions } from './loadout-header-actions';

const mockLoadout: Loadout = {
  [KINETIC_BUCKET]: {
    itemHash: 1001n,
    instanceId: '6917530200672292224',
    name: 'Ace of Spades',
    details: {
      baseInfo: {
        bucketHash: BigInt(KINETIC_BUCKET),
        icon: '',
        instanceId: '6917530200672292224',
        itemHash: 1001n,
        itemTypeAndTierDisplayName: '',
        itemTypeDisplayName: '',
        name: 'Ace of Spades',
        tierType: 6,
        tierTypeName: 'Exotic',
      },
      stats: {},
      perks: [],
      sockets: [],
    },
  },
  [HELMET_BUCKET]: {
    itemHash: 2001n,
    instanceId: '6917530199974468997',
    name: 'Helm',
    details: {
      baseInfo: {
        bucketHash: BigInt(HELMET_BUCKET),
        icon: '',
        instanceId: '6917530199974468997',
        itemHash: 2001n,
        itemTypeAndTierDisplayName: '',
        itemTypeDisplayName: '',
        name: 'Helm',
        tierType: 5,
        tierTypeName: 'Legendary',
      },
      stats: {},
      perks: [],
      sockets: [],
    },
  },
};

describe('LoadoutHeaderActions', () => {
  function renderActions(props: Parameters<typeof LoadoutHeaderActions>[0]) {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <TooltipProvider>
            <LoadoutHeaderActions {...props} />
          </TooltipProvider>
        ),
      },
    ]);
    return render(<RouterProvider router={router} />);
  }

  it('renders trash icon for owner', () => {
    renderActions({
      isOwner: true,
      snapshotId: 'snap-1',
      snapshotName: 'Test Loadout',
    });

    expect(
      screen.getByRole('button', { name: /delete loadout/i }),
    ).toBeInTheDocument();
  });

  it('renders share button when shareUrl is provided', () => {
    renderActions({
      isOwner: false,
      snapshotId: 'snap-1',
      shareUrl: 'https://d2onetrick.com/share/loadout-1',
    });

    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('copies share link when share button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderActions({
      isOwner: false,
      snapshotId: 'snap-1',
      shareUrl: 'https://d2onetrick.com/share/loadout-1',
    });

    const shareButton = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        'https://d2onetrick.com/share/loadout-1',
      );
    });
  });

  it('renders Copy DIM Query button for owner when valid gear instanceIds exist', () => {
    renderActions({
      isOwner: true,
      snapshotId: 'snap-1',
      loadout: mockLoadout,
    });

    expect(
      screen.getByRole('button', { name: /copy dim query/i }),
    ).toBeInTheDocument();
  });

  it('hides Copy DIM Query button for non-owner even when valid gear instanceIds exist', () => {
    renderActions({
      isOwner: false,
      snapshotId: 'snap-1',
      shareUrl: 'https://d2onetrick.com/share/loadout-1',
      loadout: mockLoadout,
    });

    expect(
      screen.queryByRole('button', { name: /copy dim query/i }),
    ).not.toBeInTheDocument();
  });

  it('hides Copy DIM Query button for owner when loadout has no valid gear instanceIds', () => {
    renderActions({
      isOwner: true,
      snapshotId: 'snap-1',
      loadout: {},
    });

    expect(
      screen.queryByRole('button', { name: /copy dim query/i }),
    ).not.toBeInTheDocument();
  });

  it('copies DIM search query and shows tooltip feedback when Copy DIM Query is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderActions({
      isOwner: true,
      snapshotId: 'snap-1',
      loadout: mockLoadout,
    });

    const copyDimButton = screen.getByRole('button', {
      name: /copy dim query/i,
    });
    fireEvent.click(copyDimButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        "(id:'6917530200672292224') OR (id:'6917530199974468997')",
      );
    });
    expect(
      await screen.findAllByText('Copied DIM Query!'),
    ).not.toHaveLength(0);
  });

  it('shows Failed to copy! feedback when copying DIM query fails', async () => {
    const writeTextMock = vi
      .fn()
      .mockRejectedValue(new Error('Clipboard unavailable'));
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderActions({
      isOwner: true,
      snapshotId: 'snap-1',
      loadout: mockLoadout,
    });

    const copyDimButton = screen.getByRole('button', {
      name: /copy dim query/i,
    });
    fireEvent.click(copyDimButton);

    expect(
      await screen.findAllByText('Failed to copy!'),
    ).not.toHaveLength(0);
  });

  it('renders nothing for non-owner without shareUrl', () => {
    const { container } = renderActions({
      isOwner: false,
      snapshotId: 'snap-1',
      snapshotName: 'Test Loadout',
    });

    expect(container).toBeEmptyDOMElement();
  });
});

