import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { DeleteSessionDialog } from './delete-session-dialog';

describe('DeleteSessionDialog', () => {
  function renderDialog(props: Parameters<typeof DeleteSessionDialog>[0]) {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <DeleteSessionDialog {...props} />,
      },
    ]);
    return render(<RouterProvider router={router} />);
  }

  it('renders trigger button and opens modal when clicked', () => {
    renderDialog({
      sessionId: 'sess-123',
      sessionName: 'Trials Run',
      characterId: 'char-456',
      userId: 'user-789',
    });

    const triggerButton = screen.getByRole('button', {
      name: /delete session/i,
    });
    expect(triggerButton).toBeInTheDocument();

    fireEvent.click(triggerButton);

    expect(screen.getByText('Delete "Trials Run"')).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete this session/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('includes required hidden inputs for deletion action', () => {
    renderDialog({
      sessionId: 'sess-123',
      sessionName: 'Trials Run',
      characterId: 'char-456',
      userId: 'user-789',
    });

    fireEvent.click(screen.getByRole('button', { name: /delete session/i }));

    const form = document.querySelector('form');
    expect(form).toHaveAttribute('action', '/action/delete-session');
    expect(form).toHaveAttribute('method', 'post');

    const sessionIdInput = document.querySelector('input[name="sessionId"]');
    const characterIdInput = document.querySelector(
      'input[name="characterId"]',
    );
    const userIdInput = document.querySelector('input[name="userId"]');

    expect(sessionIdInput).toHaveValue('sess-123');
    expect(characterIdInput).toHaveValue('char-456');
    expect(userIdInput).toHaveValue('user-789');
  });
});
