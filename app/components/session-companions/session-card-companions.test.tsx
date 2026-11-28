import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SessionCompanion } from '~/api';

import { SessionCardCompanions } from './session-card-companions';

const mockCompanion: SessionCompanion = {
  userId: 'user-tragic',
  displayName: 'Tragic',
  sharedMatches: 3,
  wins: 2,
  losses: 1,
  sessions: [
    {
      sessionId: 'sess-tragic',
      characterId: 'char-tragic',
      class: 'Titan',
      emblemUrl: '/common/destiny2_content/icons/emblem.jpg',
      sharedMatches: 3,
    },
  ],
};

describe('SessionCardCompanions', () => {
  it('renders nothing for solo sessions with no companions', () => {
    const { container } = render(<SessionCardCompanions companions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders companion display name, emblem, shared match count, and W-L record', () => {
    render(
      <SessionCardCompanions companions={[mockCompanion]} totalMatches={6} />,
    );

    expect(screen.getByText('Fireteam')).toBeInTheDocument();
    expect(screen.getByText('Tragic')).toBeInTheDocument();
    expect(screen.getByText('3/6 matches')).toBeInTheDocument();
    expect(screen.getByText('2W-1L')).toBeInTheDocument();
    expect(screen.getByAltText('Tragic emblem')).toHaveAttribute(
      'src',
      'https://www.bungie.net/common/destiny2_content/icons/emblem.jpg',
    );
  });

  it('caps visible pills and shows overflow count when more than 5 companions exist', () => {
    const companions: SessionCompanion[] = Array.from(
      { length: 6 },
      (_, i) => ({
        userId: `user-${i}`,
        displayName: `Guardian ${i + 1}`,
        sharedMatches: 2,
        wins: 1,
        losses: 1,
        sessions: [],
      }),
    );

    render(<SessionCardCompanions companions={companions} />);

    expect(screen.getByText('Guardian 1')).toBeInTheDocument();
    expect(screen.getByText('Guardian 5')).toBeInTheDocument();
    expect(screen.queryByText('Guardian 6')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });
});
