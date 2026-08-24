import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { CharacterSelect } from './character-select';

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
  useIsNavigating: () => [false],
}));

describe('CharacterSelect Route', () => {
  it('renders character select list with Guardian name', () => {
    const props = {} as unknown as ComponentProps<typeof CharacterSelect>;
    const router = createMemoryRouter([
      {
        path: '/',
        element: <CharacterSelect {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/Welcome, TestGuardian/i)).toBeInTheDocument();
    expect(screen.getByText('Hunter')).toBeInTheDocument();
    expect(screen.getByText('Warlock')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /pick guardian/i }),
    ).toBeInTheDocument();
  });
});
