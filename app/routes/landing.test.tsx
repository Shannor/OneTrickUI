import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { Landing } from './landing';

describe('Landing Component', () => {
  it('renders "Start a Session" link when profile is null (signed out)', () => {
    const props = {
      loaderData: {
        activeCount: 0,
        activeSessions: [],
        recent: [],
        todayCount: 0,
        weekCount: 0,
        auth: undefined,
        profile: null,
        recentProfiles: {},
      },
    } as unknown as ComponentProps<typeof Landing>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Landing {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    const links = screen.getAllByRole('link', { name: /start a session/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/login');
  });

  it('renders "Continue to {displayName}" link when profile is provided (signed in)', () => {
    const props = {
      loaderData: {
        activeCount: 0,
        activeSessions: [],
        recent: [],
        todayCount: 0,
        weekCount: 0,
        auth: { id: '123' },
        profile: {
          id: '123',
          displayName: 'Guardian#1234',
          uniqueName: 'Guardian#1234',
          characters: [],
          membershipId: '456',
          membershipType: 3,
        },
        recentProfiles: {},
      },
    } as unknown as ComponentProps<typeof Landing>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Landing {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    const link = screen.getByRole('link', {
      name: /continue to guardian#1234/i,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/profile/123');
  });
});
