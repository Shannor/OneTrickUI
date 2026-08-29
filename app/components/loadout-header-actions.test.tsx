import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';

import { LoadoutHeaderActions } from './loadout-header-actions';

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

    expect(writeTextMock).toHaveBeenCalledWith(
      'https://d2onetrick.com/share/loadout-1',
    );
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
