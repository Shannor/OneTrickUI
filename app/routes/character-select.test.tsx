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

  it('renders unrecorded Guardian fallback with Start Recording, Share 1 Trick, and Search actions on error', () => {
    mockUseProfileData.mockReturnValue({
      type: 'error',
      error: 'Profile not found',
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
});
