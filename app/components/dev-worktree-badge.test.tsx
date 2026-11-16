import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { DevWorktreeBadge, getBranchAccentClass } from './dev-worktree-badge';

describe('DevWorktreeBadge', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders branch name and port when branch is provided', () => {
    render(<DevWorktreeBadge branch="feat/similar-loadouts" port="16957" />);

    expect(
      screen.getByRole('status', {
        name: 'Active branch feat/similar-loadouts (port 16957)',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('feat/similar-loadouts')).toBeInTheDocument();
    expect(screen.getByText(':16957')).toBeInTheDocument();
  });

  it('renders nothing when branch is empty or null', () => {
    const { container } = render(
      <DevWorktreeBadge branch={null} port="5173" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('dismisses the badge and persists dismissal in sessionStorage for the same branch and port', () => {
    const { unmount } = render(
      <DevWorktreeBadge branch="feat/similar-loadouts" port="16957" />,
    );

    const dismissBtn = screen.getByRole('button', {
      name: /dismiss branch indicator/i,
    });
    fireEvent.click(dismissBtn);

    expect(screen.queryByText('feat/similar-loadouts')).not.toBeInTheDocument();

    unmount();

    // Re-mounting the same branch + port remains dismissed in the current session
    render(<DevWorktreeBadge branch="feat/similar-loadouts" port="16957" />);
    expect(screen.queryByText('feat/similar-loadouts')).not.toBeInTheDocument();

    // Another worktree branch/port is still shown
    render(
      <DevWorktreeBadge branch="fix/session-overview-loadout" port="14210" />,
    );
    expect(
      screen.getByText('fix/session-overview-loadout'),
    ).toBeInTheDocument();
  });

  it('returns a deterministic Tailwind accent background class per branch', () => {
    const first = getBranchAccentClass('feat/similar-loadouts');
    const second = getBranchAccentClass('feat/similar-loadouts');

    expect(first).toBe(second);
    expect(first).toMatch(/^bg-\w+-500$/);
  });
});
