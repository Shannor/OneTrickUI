import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { LoadoutUpdateForm } from './loadout-update-form';

describe('LoadoutUpdateForm', () => {
  function renderForm(props: Parameters<typeof LoadoutUpdateForm>[0]) {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <LoadoutUpdateForm {...props} />,
      },
    ]);
    return render(<RouterProvider router={router} />);
  }

  it('renders input fields with default values', () => {
    renderForm({
      snapshotId: 'snap-123',
      defaultName: 'PvP Meta Build',
      defaultDescription: 'High mobility Titan build',
    });

    const nameInput = screen.getByPlaceholderText('Loadout Name');
    const descTextarea = screen.getByPlaceholderText('Add a description...');
    const saveButton = screen.getByRole('button', { name: /save/i });

    expect(nameInput).toHaveValue('PvP Meta Build');
    expect(descTextarea).toHaveValue('High mobility Titan build');
    expect(saveButton).toBeInTheDocument();
  });

  it('includes hidden snapshotId input and correct form action', () => {
    renderForm({
      snapshotId: 'snap-123',
      defaultName: 'PvP Meta Build',
    });

    const form = document.querySelector('form');
    expect(form).toHaveAttribute('action', '/action/update-loadout');
    expect(form).toHaveAttribute('method', 'post');

    const snapshotIdInput = document.querySelector('input[name="snapshotId"]');
    expect(snapshotIdInput).toHaveValue('snap-123');
  });
});
