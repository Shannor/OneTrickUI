import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CharacterSelect } from './character-select';

const mockUseProfileData = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => mockUseProfileData(),
  useIsNavigating: () => [false],
}));

const ownerProfileData = {
  type: 'owner',
  profile: {
    id: 'user-123',
    displayName: 'TestGuardian',
    characters: [
      {
        id: 'char-1',
        class: 'Hunter',
        race: 'Human',
        light: 2000n,
        emblemURL: '/logo.svg',
        emblemBackgroundURL: '/hero-landing.svg',
        currentTitle: 'Flawless',
      },
      {
        id: 'char-2',
        class: 'Warlock',
        race: 'Awoken',
        light: 2000n,
        emblemURL: '/logo.svg',
        emblemBackgroundURL: '/hero-landing.svg',
        currentTitle: 'Conqueror',
      },
    ],
  },
};

describe('CharacterSelect Route', () => {
  beforeEach(() => {
    mockUseProfileData.mockReturnValue(ownerProfileData);
  });

  it('renders character select list with Guardian name and disabled Pick Guardian button by default', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <CharacterSelect />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/Welcome, TestGuardian/i)).toBeInTheDocument();
    expect(screen.getByText('Hunter')).toBeInTheDocument();
    expect(screen.getByText('Warlock')).toBeInTheDocument();

    const pickButton = screen.getByRole('button', { name: /pick guardian/i });
    expect(pickButton).toBeInTheDocument();
    expect(pickButton).toBeDisabled();
  });

  it('enables Pick Guardian link when a character is selected', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <CharacterSelect />,
      },
    ]);

    render(<RouterProvider router={router} />);

    const hunterCard = screen.getByText('Hunter');
    fireEvent.click(hunterCard);

    const pickLink = screen.getByRole('link', { name: /pick guardian/i });
    expect(pickLink).toBeInTheDocument();
    expect(pickLink).toHaveAttribute('href', '/c/char-1');
  });

  it('renders unrecorded Guardian fallback with Start Recording, Share 1 Trick, and Search actions on 404 when signed out', () => {
    mockUseProfileData.mockReturnValue({
      type: 'error',
      error: 'Profile not found',
      status: 404,
      isNotFound: true,
      isSignedIn: false,
    });

    const router = createMemoryRouter(
      [
        {
          path: '/profile/unknown-id',
          element: <CharacterSelect />,
        },
      ],
      { initialEntries: ['/profile/unknown-id'] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Guardian Not Recorded')).toBeInTheDocument();
    expect(
      screen.getByText(/1 trick only supports guardians who have recorded/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /start recording/i }),
    ).toHaveAttribute('href', '/login');
    expect(
      screen.getByRole('button', { name: /share 1 trick/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /search guardians/i }),
    ).toHaveAttribute('href', '/search');
  });

  it('hides Start Recording /login CTA on 404 unrecorded fallback when signed in', () => {
    mockUseProfileData.mockReturnValue({
      type: 'error',
      error: 'Profile not found',
      status: 404,
      isNotFound: true,
      isSignedIn: true,
    });

    const router = createMemoryRouter(
      [
        {
          path: '/profile/unknown-id',
          element: <CharacterSelect />,
        },
      ],
      { initialEntries: ['/profile/unknown-id'] },
    );

    render(<RouterProvider router={router} />);

    expect(
      screen.queryByRole('link', { name: /start recording/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /share 1 trick/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /search guardians/i }),
    ).toHaveAttribute('href', '/search');
  });

  it('renders transient unavailable state on 503 errors without showing Guardian Not Recorded', () => {
    mockUseProfileData.mockReturnValue({
      type: 'error',
      error: 'Destiny servers are temporarily down for maintenance.',
      status: 503,
      isNotFound: false,
      isSignedIn: true,
    });

    const router = createMemoryRouter(
      [
        {
          path: '/profile/user-123',
          element: <CharacterSelect />,
        },
      ],
      { initialEntries: ['/profile/user-123'] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Unable to Load Profile')).toBeInTheDocument();
    expect(
      screen.getByText('Destiny servers are temporarily down for maintenance.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Guardian Not Recorded')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /start recording/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /search guardians/i }),
    ).toHaveAttribute('href', '/search');
  });
});
