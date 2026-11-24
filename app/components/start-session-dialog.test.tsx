import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { RouterProvider, createMemoryRouter, redirect } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { toast } from '~/components/ui/sonner';

import { StartSessionDialog } from './start-session-dialog';

vi.mock('~/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('StartSessionDialog', () => {
  it('opens dialog when trigger is clicked and renders Track Competitive Score toggle unchecked by default', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <StartSessionDialog
            characterId="char-100"
            userId="user-1"
            triggerLabel="Start Session"
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    const triggerButton = screen.getByRole('button', {
      name: /start session/i,
    });
    expect(triggerButton).toBeInTheDocument();

    fireEvent.click(triggerButton);

    expect(
      screen.getByText(
        /configure tracking options before queueing into the crucible/i,
      ),
    ).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', {
      name: /track competitive score/i,
    }) as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);
    expect(checkbox).toHaveAttribute('name', 'trackComp');
    expect(checkbox).toHaveAttribute('value', 'true');

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    const form = checkbox.closest('form');
    expect(form).toHaveAttribute('action', '/action/start-session');
    expect(form).toHaveAttribute('method', 'post');

    const charInput = form?.querySelector(
      'input[name="characterId"]',
    ) as HTMLInputElement;
    const userInput = form?.querySelector(
      'input[name="userId"]',
    ) as HTMLInputElement;
    expect(charInput?.value).toBe('char-100');
    expect(userInput?.value).toBe('user-1');
  });

  it('disables the trigger button when characterId or userId is missing', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <StartSessionDialog characterId="" userId="user-1" />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('button', { name: /start session/i }),
    ).toBeDisabled();
  });

  it('displays an error alert and toast while keeping dialog open when /action/start-session returns an error', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <StartSessionDialog
            characterId="char-100"
            userId="user-1"
            triggerLabel="Start First Session"
          />
        ),
      },
      {
        path: '/action/start-session',
        action: async () => ({ error: 'Session already active' }),
      },
    ]);

    render(<RouterProvider router={router} />);

    fireEvent.click(
      screen.getByRole('button', { name: /start first session/i }),
    );

    const submitButtons = screen.getAllByRole('button', {
      name: /^start session$/i,
    });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Session already active',
      );
    });
    expect(toast.error).toHaveBeenCalledWith('Session already active');
  });

  it('closes dialog automatically after successful same-route redirect submission', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/fireteam',
          loader: async () => ({ ok: true }),
          element: (
            <StartSessionDialog
              characterId="char-100"
              userId="user-1"
              redirectTo="/fireteam"
              triggerLabel="Start a Session"
            />
          ),
        },
        {
          path: '/action/start-session',
          action: async () => redirect('/fireteam'),
        },
      ],
      {
        initialEntries: ['/fireteam'],
      },
    );

    render(<RouterProvider router={router} />);

    fireEvent.click(
      await screen.findByRole('button', { name: /start a session/i }),
    );
    expect(
      screen.getByText(/configure tracking options before queueing/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^start session$/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(/configure tracking options before queueing/i),
      ).not.toBeInTheDocument();
    });
  });

  it('resets submitting lock if closed externally while a request is in flight', async () => {
    let resolveAction!: (val: { error?: string }) => void;

    function ControlledHarness() {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(false)}>
            Force Close
          </button>
          <button type="button" onClick={() => setIsOpen(true)}>
            Force Open
          </button>
          <StartSessionDialog
            characterId="char-100"
            userId="user-1"
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            triggerLabel="Open Dialog"
          />
        </>
      );
    }

    const router = createMemoryRouter([
      {
        path: '/',
        element: <ControlledHarness />,
      },
      {
        path: '/action/start-session',
        action: () =>
          new Promise<{ error?: string }>((resolve) => {
            resolveAction = resolve;
          }),
      },
    ]);

    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByRole('button', { name: /^start session$/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /force close/i, hidden: true }),
    );

    await waitFor(() => {
      expect(
        screen.queryByText(/configure tracking options before queueing/i),
      ).not.toBeInTheDocument();
    });

    resolveAction({});

    fireEvent.click(screen.getByRole('button', { name: /force open/i }));
    expect(
      screen.getByText(/configure tracking options before queueing/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(/configure tracking options before queueing/i),
      ).not.toBeInTheDocument();
    });
  });
});
