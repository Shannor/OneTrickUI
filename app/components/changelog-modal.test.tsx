import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChangelogModal } from './changelog-modal';

describe('ChangelogModal', () => {
  it('renders trigger button "What\'s New"', () => {
    render(<ChangelogModal />);
    expect(
      screen.getByRole('button', { name: /what's new/i }),
    ).toBeInTheDocument();
  });

  it('renders modal content when controlled open is true', () => {
    render(<ChangelogModal open={true} />);
    expect(screen.getByText("What's New in One Trick")).toBeInTheDocument();
    expect(
      screen.getByText('Community Sessions & Modernized Date Formatting'),
    ).toBeInTheDocument();
  });
});
