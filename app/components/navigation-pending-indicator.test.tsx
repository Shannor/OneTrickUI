import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NavigationPendingIndicator } from './navigation-pending-indicator';

describe('NavigationPendingIndicator', () => {
  it('renders nothing when navigation is idle', () => {
    const { container } = render(<NavigationPendingIndicator scope="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders only a non-blocking progress bar without the blurred loading overlay for same-route updates', () => {
    render(<NavigationPendingIndicator scope="same-route" />);

    expect(
      screen.getByRole('progressbar', { name: 'Updating view' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders only a non-blocking progress bar without the blurred loading overlay for sub-tab switches', () => {
    render(<NavigationPendingIndicator scope="sub-tab" />);

    expect(
      screen.getByRole('progressbar', { name: 'Updating view' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders both progress bar and loading overlay for cross-route transitions', () => {
    render(<NavigationPendingIndicator scope="cross-route" />);

    expect(
      screen.getByRole('progressbar', { name: 'Loading page' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
