import { describe, expect, it } from 'vitest';

import { redirectBack } from './auth';

describe('redirectBack', () => {
  it('redirects to fallback when Referer header is missing', () => {
    const request = new Request('http://localhost:5173/action/test', {
      method: 'POST',
    });

    const response = redirectBack(request, { fallback: '/fallback-path' });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/fallback-path');
  });

  it('redirects to referer path when Referer header is present and same origin', () => {
    const request = new Request('http://localhost:5173/action/test', {
      method: 'POST',
      headers: {
        Referer: 'http://localhost:5173/profile/123/c/456/sessions?page=2',
      },
    });

    const response = redirectBack(request, { fallback: '/' });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      '/profile/123/c/456/sessions?page=2',
    );
  });

  it('redirects to fallback when Referer has a different origin', () => {
    const request = new Request('http://localhost:5173/action/test', {
      method: 'POST',
      headers: {
        Referer: 'https://evil.com/phishing',
      },
    });

    const response = redirectBack(request, { fallback: '/safe-fallback' });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/safe-fallback');
  });

  it('passes additional response options like custom headers', () => {
    const request = new Request('http://localhost:5173/action/test', {
      method: 'POST',
      headers: {
        Referer: 'http://localhost:5173/profile/123',
      },
    });

    const response = redirectBack(request, {
      fallback: '/',
      response: {
        headers: {
          'Set-Cookie': 'test=value',
        },
      },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/profile/123');
    expect(response.headers.get('Set-Cookie')).toBe('test=value');
  });
});
