import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ActiveSessionsPage } from './active-sessions';

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useLoaderData: () => ({
      activeSessions: [],
      profiles: {},
      auth: null,
    }),
  };
});

describe('ActiveSessionsPage', () => {
  it('renders "Start a Session" buttons when signed out', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/active-sessions',
          element: <ActiveSessionsPage />,
        },
      ],
      { initialEntries: ['/active-sessions'] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: /start a session/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/login');
  });
});
