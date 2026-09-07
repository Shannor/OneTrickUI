import { describe, expect, it, vi } from 'vitest';
import { getPreferences, setPreferences } from '~/.server/preferences';

import { action } from './set-fireteam';

vi.mock('~/.server/preferences', () => ({
  getPreferences: vi.fn(),
  setPreferences: vi.fn(),
}));

describe('set-fireteam action', () => {
  it('returns null if characterId or userId is missing', async () => {
    const formData = new FormData();
    const request = new Request('http://localhost/action/set-fireteam', {
      method: 'POST',
      body: formData,
    });

    // SAFETY: Mocking action arguments for test execution
    const result = await action({ request } as never);
    expect(result).toBeNull();
  });

  it('updates fireteam preferences and redirects back', async () => {
    vi.mocked(getPreferences).mockResolvedValueOnce({
      fireteam: {
        'user-1': 'char-hunter',
      },
    });

    vi.mocked(setPreferences).mockResolvedValueOnce({
      headers: {
        'Set-Cookie': '__preferences_session=abc123',
      },
    });

    const formData = new FormData();
    formData.append('characterId', 'char-warlock');
    formData.append('userId', 'user-2');
    formData.append('redirect', '/profile/user-1/c/char-hunter/fireteam');

    const request = new Request('http://localhost/action/set-fireteam', {
      method: 'POST',
      body: formData,
    });

    // SAFETY: Mocking action arguments for test execution
    const response = (await action({ request } as never)) as Response;

    expect(setPreferences).toHaveBeenCalledWith(request, {
      fireteam: {
        'user-1': 'char-hunter',
        'user-2': 'char-warlock',
      },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Set-Cookie')).toBe(
      '__preferences_session=abc123',
    );
  });

  it('updates URL characterId segment when modifying profile owner character', async () => {
    vi.mocked(getPreferences).mockResolvedValueOnce({
      fireteam: {},
    });

    vi.mocked(setPreferences).mockResolvedValueOnce({
      headers: {
        'Set-Cookie': '__preferences_session=abc123',
      },
    });

    const formData = new FormData();
    formData.append('characterId', 'char-titan');
    formData.append('userId', 'user-1');
    formData.append('redirect', '/profile/user-1/c/char-hunter/fireteam');

    const request = new Request('http://localhost/action/set-fireteam', {
      method: 'POST',
      body: formData,
    });

    // SAFETY: Mocking action arguments for test execution
    const response = (await action({ request } as never)) as Response;

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      '/profile/user-1/c/char-titan/fireteam',
    );
  });
});
