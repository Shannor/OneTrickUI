import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';
import type { MatchCompanion } from '~/lib/session-companions';

import { MatchCompanionsRow } from './match-companions-row';

const mockMatchCompanion: MatchCompanion = {
  characterId: 'char-tragic',
  userId: 'user-tragic',
  displayName: 'Tragic',
  characterClass: 'Titan',
  emblemUrl: 'https://www.bungie.net/img/emblem.jpg',
  sessionId: 'sess-tragic',
  kills: 18,
  deaths: 9,
  assists: 6,
  kd: 2,
  kda: 2.67,
  hasPerformance: true,
  subclassName: 'Striker',
  subclassIcon: 'https://www.bungie.net/img/arc.png',
  weapons: [
    {
      itemHash: '1111',
      name: 'Rose',
      icon: 'https://www.bungie.net/img/rose.png',
      isEnhanced: true,
      hasActiveCatalyst: false,
    },
    {
      itemHash: '2222',
      name: 'Matador 64',
      icon: 'https://www.bungie.net/img/matador.png',
      isEnhanced: false,
      hasActiveCatalyst: false,
    },
  ],
};

function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter([
    { path: '/', element: <TooltipProvider>{ui}</TooltipProvider> },
  ]);
  return render(<RouterProvider router={router} />);
}

describe('MatchCompanionsRow', () => {
  it('renders nothing when no companions were present in the match', () => {
    const { container } = renderWithRouter(
      <MatchCompanionsRow companions={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders companion emblem, linked name, K/D, subclass icon, and weapon icons without bubbling clicks to parent match row', () => {
    const parentClick = vi.fn();
    renderWithRouter(
      <div onClick={parentClick}>
        <MatchCompanionsRow companions={[mockMatchCompanion]} />
      </div>,
    );

    expect(screen.getByText('Fireteam')).toBeInTheDocument();
    expect(screen.getByAltText('Tragic emblem')).toHaveAttribute(
      'src',
      'https://www.bungie.net/img/emblem.jpg',
    );
    expect(screen.getByText('2.00')).toBeInTheDocument();
    expect(screen.getByText('K/D')).toBeInTheDocument();

    const sessionLink = screen.getByRole('link', {
      name: /view tragic's session/i,
    });
    expect(sessionLink).toHaveAttribute(
      'href',
      '/profile/user-tragic/c/char-tragic/sessions/sess-tragic',
    );

    expect(screen.getByAltText('Striker')).toHaveAttribute(
      'src',
      'https://www.bungie.net/img/arc.png',
    );
    expect(screen.getByAltText('Rose')).toHaveAttribute(
      'src',
      'https://www.bungie.net/img/rose.png',
    );
    expect(screen.getByAltText('Matador 64')).toHaveAttribute(
      'src',
      'https://www.bungie.net/img/matador.png',
    );

    fireEvent.click(screen.getByAltText('Rose'));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
