import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FireteamMeta } from './fireteam-meta';

vi.mock('~/lib/utils', () => ({
  getSiteOrigin: () => 'https://1trick.test',
}));

describe('FireteamMeta', () => {
  it('renders title, OG/Twitter tags, and canonical URL using getSiteOrigin', () => {
    render(<FireteamMeta id="user-42" characterId="char-99" />);

    expect(document.title).toBe('Fireteam | 1 Trick');
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
    ).toBe(
      'View your current fireteam and manage active character selections on 1 Trick.',
    );
    expect(
      document
        .querySelector('meta[property="og:url"]')
        ?.getAttribute('content'),
    ).toBe('https://1trick.test/profile/user-42/c/char-99/fireteam');
    expect(
      document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute('content'),
    ).toBe('https://1trick.test/og-image.png');
    expect(
      document
        .querySelector('meta[name="twitter:image"]')
        ?.getAttribute('content'),
    ).toBe('https://1trick.test/twitter-image.png');
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://1trick.test/profile/user-42/c/char-99/fireteam');
  });

  it('omits og:url and canonical link when id or characterId is missing', () => {
    render(<FireteamMeta id="user-42" />);

    expect(document.title).toBe('Fireteam | 1 Trick');
    expect(document.querySelector('meta[property="og:url"]')).toBeNull();
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });
});
