import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SessionDate } from './session-date';

describe('SessionDate', () => {
  it('renders start date correctly', () => {
    render(<SessionDate startedAt="2025-01-15T12:00:00Z" />);
    expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
  });

  it('renders start date and duration when completedAt is provided', () => {
    render(
      <SessionDate
        startedAt="2025-01-15T12:00:00Z"
        completedAt="2025-01-15T14:00:00Z"
      />,
    );
    expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
    expect(screen.getByText('(about 2 hours)')).toBeInTheDocument();
  });

  it('returns null when startedAt is missing', () => {
    const { container } = render(<SessionDate startedAt={null} />);
    expect(container.firstChild).toBeNull();
  });
});
