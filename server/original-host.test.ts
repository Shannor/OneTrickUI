import { describe, expect, it, vi } from 'vitest';

import {
  createOriginalHostMiddleware,
  resolveTrustedOriginalHost,
} from './original-host.mjs';

describe('resolveTrustedOriginalHost', () => {
  it('accepts known application hostnames and normalizes case/port', () => {
    expect(resolveTrustedOriginalHost('d2onetrick.com')).toBe('d2onetrick.com');
    expect(resolveTrustedOriginalHost('WWW.D2ONETRICK.COM:443')).toBe(
      'www.d2onetrick.com',
    );
  });

  it('rejects unknown or empty hostnames', () => {
    expect(resolveTrustedOriginalHost(undefined)).toBeNull();
    expect(resolveTrustedOriginalHost('')).toBeNull();
    expect(resolveTrustedOriginalHost('evil.example.com')).toBeNull();
  });
});

describe('createOriginalHostMiddleware', () => {
  it('restores x-forwarded-host only when x-original-host is allowlisted', () => {
    const middleware = createOriginalHostMiddleware();
    const next = vi.fn();

    const trustedReq = {
      headers: {
        host: 'onetrickui-63827765203.us-central1.run.app',
        'x-original-host': 'd2onetrick.com',
      } as Record<string, string | undefined>,
    };
    middleware(trustedReq, {}, next);
    expect(trustedReq.headers['x-forwarded-host']).toBe('d2onetrick.com');

    const untrustedReq = {
      headers: {
        host: 'onetrickui-63827765203.us-central1.run.app',
        'x-original-host': 'attacker.example.com',
      } as Record<string, string | undefined>,
    };
    middleware(untrustedReq, {}, next);
    expect(untrustedReq.headers['x-forwarded-host']).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(2);
  });
});
