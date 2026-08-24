import { describe, expect, it } from 'vitest';

import { loader as appleTouchLoader } from './apple-touch-icon.png';
import { loader as faviconLoader } from './favicon.ico';

describe('Icon Resource Route Loaders', () => {
  it('serves favicon.ico with 200 status and image/x-icon content-type', async () => {
    const request = new Request('http://localhost/favicon.ico');
    const response = await faviconLoader({
      request,
      params: {},
    } as Parameters<typeof faviconLoader>[0]);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/x-icon');
  });

  it('serves apple-touch-icon.png and variants with 200 status and image/png content-type', async () => {
    const variants = [
      'http://localhost/apple-touch-icon.png',
      'http://localhost/apple-touch-icon-precomposed.png',
      'http://localhost/apple-touch-icon-120x120.png',
      'http://localhost/apple-touch-icon-120x120-precomposed.png',
      'http://localhost/apple-touch-icon-152x152.png',
      'http://localhost/apple-touch-icon-180x180.png',
    ];

    for (const url of variants) {
      const request = new Request(url);
      const response = await appleTouchLoader({
        request,
        params: {},
      } as Parameters<typeof appleTouchLoader>[0]);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
    }
  });
});
