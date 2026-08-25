import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { CharacterLayout } from './character-layout';

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => ({
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
  }),
}));

describe('CharacterLayout', () => {
  it('renders character selector pills for each character', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/profile/:id/c/:characterId',
          element: <CharacterLayout />,
        },
      ],
      {
        initialEntries: ['/profile/user-123/c/char-1'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Hunter')).toBeInTheDocument();
    expect(screen.getByText('Warlock')).toBeInTheDocument();
  });
});
