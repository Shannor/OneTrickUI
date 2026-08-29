import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { DeleteConfirmationDialog } from './delete-confirmation-dialog';

describe('DeleteConfirmationDialog', () => {
  function renderDialog(props: Parameters<typeof DeleteConfirmationDialog>[0]) {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <DeleteConfirmationDialog {...props} />,
      },
    ]);
    return render(<RouterProvider router={router} />);
  }

  it('renders custom title, description, and hidden form fields when opened', () => {
    renderDialog({
      title: 'Delete Item',
      description: 'Are you sure?',
      action: '/action/delete-item',
      hiddenFields: { itemId: 'item-100', userId: 'user-200' },
      triggerText: 'Remove',
      confirmText: 'Confirm Delete',
    });

    const triggerButton = screen.getByRole('button', { name: /remove/i });
    expect(triggerButton).toBeInTheDocument();

    fireEvent.click(triggerButton);

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();

    const form = document.querySelector('form');
    expect(form).toHaveAttribute('action', '/action/delete-item');
    expect(form).toHaveAttribute('method', 'post');

    const itemIdInput = document.querySelector('input[name="itemId"]');
    const userIdInput = document.querySelector('input[name="userId"]');
    expect(itemIdInput).toHaveValue('item-100');
    expect(userIdInput).toHaveValue('user-200');

    expect(
      screen.getByRole('button', { name: /confirm delete/i }),
    ).toBeInTheDocument();
  });
});
