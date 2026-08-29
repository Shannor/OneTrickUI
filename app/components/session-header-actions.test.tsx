import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';

import { SessionHeaderActions } from './session-header-actions';

describe('SessionHeaderActions', () => {
  function renderActions(props: Parameters<typeof SessionHeaderActions>[0]) {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <TooltipProvider>
            <SessionHeaderActions {...props} />
          </TooltipProvider>
        ),
      },
    ]);
    return render(<RouterProvider router={router} />);
  }

  it('renders share button and trash icon for owner', () => {
    renderActions({
      isOwner: true,
      isCurrent: false,
      sessionId: 'sess-1',
      sessionName: 'Test Session',
      shareUrl: 'https://example.com/share',
    });

    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete session/i }),
    ).toBeInTheDocument();
  });

  it('renders stop session button when owner and session is current', () => {
    renderActions({
      isOwner: true,
      isCurrent: true,
      sessionId: 'sess-1',
      sessionName: 'Test Session',
      characterId: 'char-1',
      shareUrl: 'https://example.com/share',
    });

    expect(
      screen.getByRole('button', { name: /stop session/i }),
    ).toBeInTheDocument();
  });

  it('does not render delete or stop session for non-owner', () => {
    renderActions({
      isOwner: false,
      isCurrent: true,
      sessionId: 'sess-1',
      sessionName: 'Test Session',
      shareUrl: 'https://example.com/share',
    });

    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete session/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /stop session/i }),
    ).not.toBeInTheDocument();
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
      isCurrent: false,
      sessionId: 'sess-1',
      shareUrl: 'https://d2onetrick.com/share/sess-1',
    });

    const shareButton = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareButton);

    expect(writeTextMock).toHaveBeenCalledWith(
      'https://d2onetrick.com/share/sess-1',
    );
  });
});
