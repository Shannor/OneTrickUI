import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { CommunitySessionsPage } from './community-sessions';

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useLoaderData: () => ({
      sessions: [],
      profiles: {},
      auth: null,
      page: 1,
      status: 'all',
    }),
  };
});

describe('CommunitySessionsPage', () => {
  it('renders Community Sessions header and filter controls', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/community-sessions',
          element: <CommunitySessionsPage />,
        },
      ],
      { initialEntries: ['/community-sessions'] },
    );

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { level: 1, name: /sessions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('All Sessions')).toBeInTheDocument();
    expect(screen.getByText('Active Only')).toBeInTheDocument();
    expect(screen.getByText('Completed Only')).toBeInTheDocument();

    const links = screen.getAllByRole('link', { name: /sign in to track/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/login');
  });
});
