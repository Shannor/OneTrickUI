import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Home, Hourglass } from 'lucide-react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SidebarProvider } from '~/components/ui/sidebar';

import { NavProjects, isRouteActive } from './nav-projects';

describe('isRouteActive', () => {
  it('correctly matches root path', () => {
    expect(isRouteActive('/', '/')).toBe(true);
    expect(isRouteActive('/sessions', '/')).toBe(false);
  });

  it('correctly matches exact public sessions path', () => {
    expect(isRouteActive('/sessions', '/sessions')).toBe(true);
    expect(isRouteActive('/sessions/123', '/sessions')).toBe(false);
  });

  it('requires exact match for character Overview route so it does not highlight on subroutes', () => {
    const overviewUrl = '/profile/user-1/c/char-1';
    expect(isRouteActive(overviewUrl, overviewUrl)).toBe(true);
    expect(
      isRouteActive('/profile/user-1/c/char-1/sessions', overviewUrl),
    ).toBe(false);
    expect(
      isRouteActive('/profile/user-1/c/char-1/loadouts', overviewUrl),
    ).toBe(false);
  });

  it('correctly matches nested profile paths', () => {
    expect(
      isRouteActive(
        '/profile/user-1/c/char-1/sessions',
        '/profile/user-1/c/char-1/sessions',
      ),
    ).toBe(true);
    expect(
      isRouteActive(
        '/profile/user-1/c/char-1/sessions/sess-123',
        '/profile/user-1/c/char-1/sessions',
      ),
    ).toBe(true);
  });
});

describe('NavProjects Component', () => {
  const projects = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Sessions', url: '/sessions', icon: Hourglass },
  ];

  it('renders navigation links and applies active styles', () => {
    render(
      <SidebarProvider>
        <MemoryRouter initialEntries={['/sessions']}>
          <NavProjects projects={projects} label="Navigation" />
        </MemoryRouter>
      </SidebarProvider>,
    );

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
  });
});
