import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ErrorBoundaryContent } from './error-boundary-content';

describe('ErrorBoundaryContent', () => {
  it('renders 404 recovery page with Home, Active Feeds, and Go Back buttons', () => {
    const error404 = {
      status: 404,
      statusText: 'Not Found',
      data: 'Error: No route matches URL "/invalid-path"',
    };

    render(
      <MemoryRouter>
        <ErrorBoundaryContent error={error404} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to home/i })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: /active feeds/i })).toHaveAttribute(
      'href',
      '/active-sessions',
    );
    expect(
      screen.getByRole('button', { name: /go back to previous page/i }),
    ).toBeInTheDocument();
  });

  it('renders general error recovery page when error is not 404', () => {
    render(
      <MemoryRouter>
        <ErrorBoundaryContent error={new Error('Server Error')} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to home/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
