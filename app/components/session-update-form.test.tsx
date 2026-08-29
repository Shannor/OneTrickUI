import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SessionUpdateForm } from './session-update-form';

describe('SessionUpdateForm', () => {
  function renderForm(props: Parameters<typeof SessionUpdateForm>[0]) {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <SessionUpdateForm {...props} />,
      },
    ]);
    return render(<RouterProvider router={router} />);
  }

  it('renders input fields with default values', () => {
    renderForm({
      sessionId: 'sess-123',
      defaultName: 'Trials Grind',
      defaultDescription: 'Flawless attempt',
    });

    const nameInput = screen.getByPlaceholderText('Session Name');
    const descTextarea = screen.getByPlaceholderText('Add a description...');
    const saveButton = screen.getByRole('button', { name: /save/i });

    expect(nameInput).toHaveValue('Trials Grind');
    expect(descTextarea).toHaveValue('Flawless attempt');
    expect(saveButton).toBeInTheDocument();
  });

  it('includes hidden sessionId input and correct form action', () => {
    renderForm({
      sessionId: 'sess-123',
      defaultName: 'Trials Grind',
    });

    const form = document.querySelector('form');
    expect(form).toHaveAttribute('action', '/action/update-session');
    expect(form).toHaveAttribute('method', 'post');

    const sessionIdInput = document.querySelector('input[name="sessionId"]');
    expect(sessionIdInput).toHaveValue('sess-123');
  });
});
