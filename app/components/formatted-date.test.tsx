import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormattedDate } from './formatted-date';

describe('FormattedDate', () => {
  it('renders formatted date after hydration', () => {
    const testDate = new Date('2025-01-15T12:00:00Z');
    render(<FormattedDate date={testDate} formatStr="yyyy-MM-dd" />);
    expect(screen.getByText('2025-01-15')).toBeInTheDocument();
  });
});
