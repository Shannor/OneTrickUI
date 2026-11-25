import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TelemetryTruncationNotice } from './telemetry-truncation-notice';

describe('TelemetryTruncationNotice', () => {
  it('renders formatted shown and total match counts with status role', () => {
    render(<TelemetryTruncationNotice shownCount={500} totalCount={1240} />);

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent(
      'Showing most recent 500 of 1,240 tracked matches.',
    );
  });
});
