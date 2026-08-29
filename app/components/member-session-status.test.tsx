import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { MemberSessionStatus, type SessionData } from './member-session-status';

const mockPendingSession: SessionData = {
  id: 'sess-123',
  userId: 'user-1',
  characterId: 'char-100',
  name: 'PvP Trials Grind',
  status: 'pending',
  aggregateIds: ['g1', 'g2', 'g3'],
};

describe('MemberSessionStatus', () => {
  it('renders active session badge, title, games count and link when status is pending', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <MemberSessionStatus
            session={mockPendingSession}
            userId="user-1"
            characterId="char-100"
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Active Session')).toBeInTheDocument();
    expect(screen.getByText('PvP Trials Grind')).toBeInTheDocument();
    expect(screen.getByText('3 games')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /view live session/i });
    expect(link).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-100/sessions/sess-123',
    );
  });

  it('renders inactive status and Start a Session button when no pending session', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <MemberSessionStatus userId="user-1" characterId="char-100" />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /start a session/i }),
    ).toBeInTheDocument();
  });
});
