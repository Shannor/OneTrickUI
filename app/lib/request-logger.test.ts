import { describe, expect, it } from 'vitest';

import { extractRequestMeta, maskCode, sanitizeUrl } from './request-logger';

describe('request-logger', () => {
  describe('maskCode', () => {
    it('returns null for null or undefined code', () => {
      expect(maskCode(null)).toBeNull();
      expect(maskCode(undefined)).toBeNull();
      expect(maskCode('')).toBeNull();
    });

    it('returns *** for codes 6 characters or shorter', () => {
      expect(maskCode('12345')).toBe('***');
      expect(maskCode('123456')).toBe('***');
    });

    it('masks longer codes with first 6 characters and ellipsis', () => {
      expect(maskCode('d5439663e6f6f1ff025d49d92534ed88')).toBe('d54396...');
    });
  });

  describe('sanitizeUrl', () => {
    it('masks the code search parameter in URLs', () => {
      const input =
        'http://d2onetrick.com/oauth?code=d5439663e6f6f1ff025d49d92534ed88&state=1234';
      const output = sanitizeUrl(input);
      expect(output).toContain('code=d54396...');
      expect(output).toContain('state=1234');
      expect(output).not.toContain('d5439663e6f6f1ff025d49d92534ed88');
    });

    it('returns original string if not a valid URL', () => {
      expect(sanitizeUrl('invalid-url')).toBe('invalid-url');
    });
  });

  describe('extractRequestMeta', () => {
    it('extracts metadata from request headers and URL', () => {
      const request = new Request(
        'https://d2onetrick.com/oauth?code=d5439663e6f6f1ff025d49d92534ed88&state=1234',
        {
          headers: {
            'user-agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
            referer: 'https://www.bungie.net/',
            'x-forwarded-for': '203.0.113.195',
            'x-forwarded-proto': 'https',
            host: 'd2onetrick.com',
            'sec-purpose': 'prefetch',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'cross-site',
            cookie: '__auth_session=123',
          },
        },
      );

      const meta = extractRequestMeta(request);
      expect(meta.method).toBe('GET');
      expect(meta.pathname).toBe('/oauth');
      expect(meta.url).not.toContain('d5439663e6f6f1ff025d49d92534ed88');
      expect(meta.url).toContain('code=d54396...');
      expect(meta.userAgent).toBe(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
      );
      expect(meta.referer).toBe('https://www.bungie.net/');
      expect(meta.ip).toBe('203.0.113.195');
      expect(meta.forwardedProto).toBe('https');
      expect(meta.host).toBe('d2onetrick.com');
      expect(meta.purpose).toBe('prefetch');
      expect(meta.secFetchDest).toBe('document');
      expect(meta.secFetchMode).toBe('navigate');
      expect(meta.secFetchSite).toBe('cross-site');
      expect(meta.hasCookie).toBe(true);
    });
  });
});
