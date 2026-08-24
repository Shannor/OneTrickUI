import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AuthRetryCard } from './auth-retry';

describe('AuthRetryCard', () => {
  it('renders default error message when no error prop is provided', () => {
    render(
      <MemoryRouter>
        <AuthRetryCard />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sign In Failed')).toBeInTheDocument();
    expect(
      screen.getByText('There was an error during sign in. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Retry Sign In')).toBeInTheDocument();
    expect(screen.getByText('Back to Login')).toBeInTheDocument();
  });

  it('renders custom error message when error prop is provided', () => {
    const customError = 'Bungie service unavailable';
    render(
      <MemoryRouter>
        <AuthRetryCard error={customError} />
      </MemoryRouter>,
    );

    expect(screen.getByText(customError)).toBeInTheDocument();
  });
});
