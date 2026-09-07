import { describe, expect, it } from 'vitest';

import { getPreferences, setPreferences } from './preferences';

describe('preferences session server module', () => {
  it('sanitizes BigInt properties when setting preferences without throwing', async () => {
    const request = new Request('http://localhost/', {
      headers: {
        Cookie: '',
      },
    });

    const result = await setPreferences(request, {
      character: {
        id: 'char-1',
        // SAFETY: Testing BigInt handling in character preferences
        light: BigInt(2020) as unknown as bigint,
        class: 'Hunter',
      },
      fireteam: {
        'user-1': 'char-1',
      },
    });

    expect(result.headers['Set-Cookie']).toBeDefined();
    expect(result.headers['Set-Cookie']).toContain('__preferences_session=');
  });

  it('retrieves preferences safely from cookie header', async () => {
    const setReq = new Request('http://localhost/', {
      headers: { Cookie: '' },
    });
    const { headers } = await setPreferences(setReq, {
      fireteam: {
        'user-123': 'char-456',
      },
    });

    const cookieHeader = headers['Set-Cookie'];
    const getReq = new Request('http://localhost/', {
      headers: {
        Cookie: cookieHeader.split(';')[0],
      },
    });

    const prefs = await getPreferences(getReq);
    expect(prefs.fireteam).toEqual({
      'user-123': 'char-456',
    });
  });
});
