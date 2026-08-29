import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FireteamHeader } from './fireteam-header';

describe('FireteamHeader', () => {
  it('renders title and description', () => {
    render(<FireteamHeader memberCount={3} />);

    expect(screen.getByText('Fireteam Overview')).toBeInTheDocument();
    expect(
      screen.getByText(
        /View your current 1 Trick fireteam, manage active Guardians/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders plural teammate count badge correctly', () => {
    render(<FireteamHeader memberCount={3} />);
    expect(screen.getByText('3 Teammates')).toBeInTheDocument();
  });

  it('renders singular teammate count badge correctly', () => {
    render(<FireteamHeader memberCount={1} />);
    expect(screen.getByText('1 Teammate')).toBeInTheDocument();
  });
});
