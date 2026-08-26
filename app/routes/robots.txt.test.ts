import { describe, expect, it } from 'vitest';
import { loader } from './robots.txt';

describe('robots.txt loader', () => {
  it('returns valid plain text response with correct content-type header', async () => {
    const request = new Request('https://d2onetrick.com/robots.txt');
    const response = loader({ request, params: {} } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');

    const text = await response.text();
    expect(text).toContain('User-agent: *');
    expect(text).toContain('Sitemap: https://d2onetrick.com/sitemap.xml');
  });
});
