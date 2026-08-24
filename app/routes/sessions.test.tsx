import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Session } from '~/api';

import Sessions from './sessions';

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useFetcher: () => ({
      state: 'idle',
      Form: (props: React.FormHTMLAttributes<HTMLFormElement>) => (
        <form {...props} />
      ),
    }),
  };
});

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => ({
    type: 'owner',
    profile: { id: '123', displayName: 'Guardian' },
    character: { characterId: 'char-1' },
  }),
}));

describe('Sessions page component', () => {
  it('renders "No Sessions" when data is empty and no active session exists', () => {
    const props = {
      params: { characterId: 'char-1', id: '123' },
      loaderData: {
        data: [],
        current: undefined,
        page: 0,
        characterId: 'char-1',
      },
    } as unknown as ComponentProps<typeof Sessions>;

    render(
      <MemoryRouter>
        <Sessions {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByText('No Sessions')).toBeInTheDocument();
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();

    const startButton = screen.getByRole('button', { name: /start first session/i });
    expect(startButton).toBeInTheDocument();

    const form = startButton.closest('form');
    expect(form).toHaveAttribute('action', '/action/start-session');
    expect(form).toHaveAttribute('method', 'post');
  });

  it('renders "No Completed Sessions" when an active session exists but no completed sessions exist', () => {
    const mockActiveSession: Session = {
      id: 'sess-active',
      userId: '123',
      characterId: 'char-1',
      name: 'Active Trial Run',
      startedAt: new Date(),
      status: 'pending',
      aggregateIds: [],
    };

    const props = {
      params: { characterId: 'char-1', id: '123' },
      loaderData: {
        data: [],
        current: mockActiveSession,
        page: 0,
        characterId: 'char-1',
      },
    } as unknown as ComponentProps<typeof Sessions>;

    render(
      <MemoryRouter>
        <Sessions {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByText('No Completed Sessions')).toBeInTheDocument();
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
  });
});
