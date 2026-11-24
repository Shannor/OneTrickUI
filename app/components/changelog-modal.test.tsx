import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CHANGELOG } from '~/data/changelog';

import { ChangelogModal } from './changelog-modal';

describe('ChangelogModal', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders trigger button "What\'s New"', () => {
    render(<ChangelogModal />);
    expect(
      screen.getByRole('button', { name: /what's new/i }),
    ).toBeInTheDocument();
  });

  it('renders modal content when controlled open is true', () => {
    render(<ChangelogModal open={true} />);
    expect(screen.getByText("What's New in 1 Trick")).toBeInTheDocument();
    expect(
      screen.getByText('Community Sessions & Modernized Date Formatting'),
    ).toBeInTheDocument();
  });

  it('marks the latest release as seen when opened', () => {
    render(<ChangelogModal />);

    const trigger = screen.getByRole('button', { name: /what's new/i });
    expect(trigger.querySelector('.animate-ping')).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(window.localStorage.getItem('onetrick_last_seen_changelog')).toBe(
      CHANGELOG[0]?.id,
    );
    expect(trigger.querySelector('.animate-ping')).not.toBeInTheDocument();
  });
});
