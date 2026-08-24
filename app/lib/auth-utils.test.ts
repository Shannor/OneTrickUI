import { describe, expect, it } from 'vitest';

import { getBungieAuthUrl } from './auth-utils';

describe('getBungieAuthUrl', () => {
  it('returns a valid Bungie OAuth URL', () => {
    const url = getBungieAuthUrl();
    expect(url).toContain('https://www.bungie.net/en/OAuth/Authorize');
    expect(url).toContain('response_type=code');
    expect(url).toContain('client_id=');
  });
});
