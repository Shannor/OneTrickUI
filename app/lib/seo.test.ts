import { describe, expect, it } from 'vitest';

import { buildMeta, getProfileFromMatches, resolveUrl } from './seo';

describe('seo utilities', () => {
  describe('resolveUrl', () => {
    it('returns base URL when path is omitted', () => {
      expect(resolveUrl()).toBe('https://d2onetrick.com');
    });

    it('resolves relative path correctly', () => {
      expect(resolveUrl('/active-sessions')).toBe(
        'https://d2onetrick.com/active-sessions',
      );
      expect(resolveUrl('login')).toBe('https://d2onetrick.com/login');
    });

    it('preserves absolute URLs', () => {
      expect(resolveUrl('https://example.com/image.jpg')).toBe(
        'https://example.com/image.jpg',
      );
    });
  });

  describe('buildMeta', () => {
    it('generates default meta tags when no options are provided', () => {
      const meta = buildMeta();

      expect(meta).toContainEqual({
        title: 'One Trick — Destiny 2 PvP Loadout & Session Tracker',
      });
      expect(meta).toContainEqual({
        name: 'description',
        content:
          'Track your Destiny 2 PvP performance across game modes, analyze real-time sessions, and inspect community loadout snapshots.',
      });
      expect(meta).toContainEqual({
        tagName: 'link',
        rel: 'canonical',
        href: 'https://d2onetrick.com',
      });
      expect(meta).toContainEqual({
        name: 'robots',
        content: 'index, follow',
      });
      expect(meta).toContainEqual({
        property: 'og:site_name',
        content: 'One Trick',
      });
      expect(meta).toContainEqual({
        property: 'og:type',
        content: 'website',
      });
      expect(meta).toContainEqual({
        property: 'og:image',
        content: 'https://d2onetrick.com/og-image.svg',
      });
      expect(meta).toContainEqual({
        name: 'twitter:card',
        content: 'summary_large_image',
      });
    });

    it('customizes meta tags based on options', () => {
      const meta = buildMeta({
        title: 'Custom Title',
        description: 'Custom Description',
        url: '/custom-path',
        image: '/custom-image.png',
        noindex: true,
      });

      expect(meta).toContainEqual({ title: 'Custom Title' });
      expect(meta).toContainEqual({
        name: 'description',
        content: 'Custom Description',
      });
      expect(meta).toContainEqual({
        tagName: 'link',
        rel: 'canonical',
        href: 'https://d2onetrick.com/custom-path',
      });
      expect(meta).toContainEqual({
        name: 'robots',
        content: 'noindex, follow',
      });
      expect(meta).toContainEqual({
        property: 'og:image',
        content: 'https://d2onetrick.com/custom-image.png',
      });
      expect(meta).toContainEqual({
        name: 'twitter:image',
        content: 'https://d2onetrick.com/custom-image.png',
      });
    });
  });

  describe('getProfileFromMatches', () => {
    it('returns undefined when matches is undefined', () => {
      expect(getProfileFromMatches()).toBeUndefined();
    });

    it('extracts profile from profile-state match', () => {
      const mockProfile = { id: '123', displayName: 'TestGuardian' };
      const matches = [
        { id: 'root', data: {} },
        { id: 'routes/profile-state', data: { profile: mockProfile } },
      ];

      expect(getProfileFromMatches(matches)).toEqual(mockProfile);
    });

    it('returns undefined if profile-state match is missing', () => {
      const matches = [{ id: 'root', data: {} }];
      expect(getProfileFromMatches(matches)).toBeUndefined();
    });
  });
});
