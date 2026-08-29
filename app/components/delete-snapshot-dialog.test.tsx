import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { DeleteSnapshotDialog } from './delete-snapshot-dialog';

describe('DeleteSnapshotDialog', () => {
  function renderDialog(props: Parameters<typeof DeleteSnapshotDialog>[0]) {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <DeleteSnapshotDialog {...props} />,
      },
    ]);
    return render(<RouterProvider router={router} />);
  }

  it('renders trigger button and opens modal when clicked', () => {
    renderDialog({
      snapshotId: 'snap-123',
      snapshotName: 'Meta Loadout',
      characterId: 'char-456',
      userId: 'user-789',
    });

    const triggerButton = screen.getByRole('button', {
      name: /delete loadout/i,
    });
    expect(triggerButton).toBeInTheDocument();

    fireEvent.click(triggerButton);

    expect(screen.getByText('Delete "Meta Loadout"')).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete this loadout/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('includes required hidden inputs for deletion action', () => {
    renderDialog({
      snapshotId: 'snap-123',
      snapshotName: 'Meta Loadout',
      characterId: 'char-456',
      userId: 'user-789',
    });

    fireEvent.click(screen.getByRole('button', { name: /delete loadout/i }));

    const form = document.querySelector('form');
    expect(form).toHaveAttribute('action', '/action/delete-snapshot');
    expect(form).toHaveAttribute('method', 'post');

    const snapshotIdInput = document.querySelector('input[name="snapshotId"]');
    const characterIdInput = document.querySelector(
      'input[name="characterId"]',
    );
    const userIdInput = document.querySelector('input[name="userId"]');

    expect(snapshotIdInput).toHaveValue('snap-123');
    expect(characterIdInput).toHaveValue('char-456');
    expect(userIdInput).toHaveValue('user-789');
  });
});
