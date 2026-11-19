import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { StartSessionDialog } from './start-session-dialog';

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
});
