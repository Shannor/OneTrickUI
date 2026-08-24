import { describe, expect, it } from 'vitest';
import { loader as appleTouchPrecomposedLoader } from './apple-touch-icon-precomposed.png';
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

  it('serves apple-touch-icon.png with 200 status and image/png content-type', async () => {
    const request = new Request('http://localhost/apple-touch-icon.png');
    const response = await appleTouchLoader({
      request,
      params: {},
    } as Parameters<typeof appleTouchLoader>[0]);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  it('serves apple-touch-icon-precomposed.png with 200 status and image/png content-type', async () => {
    const request = new Request(
      'http://localhost/apple-touch-icon-precomposed.png',
    );
    const response = await appleTouchPrecomposedLoader({
      request,
      params: {},
    } as Parameters<typeof appleTouchPrecomposedLoader>[0]);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });
});
