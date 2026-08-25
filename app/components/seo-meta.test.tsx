import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { SeoMeta } from './seo-meta';

describe('SeoMeta', () => {
  it('renders default title and description', () => {
    const { container } = render(
      <SeoMeta title="Test Page" description="Test description" />,
    );

    expect(container).toBeDefined();
    const titleEl = document.querySelector('title');
    expect(titleEl?.textContent).toBe('Test Page');

    const descEl = document.querySelector('meta[name="description"]');
    expect(descEl?.getAttribute('content')).toBe('Test description');

    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute('content')).toBe('Test Page');

    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
  });

  it('renders canonical url and image correctly', () => {
    render(
      <SeoMeta
        title="Session Details"
        description="Session description"
        url="/active-sessions"
        image="/custom-image.png"
      />,
    );

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    expect(canonicalEl?.getAttribute('href')).toBe(
      'https://d2onetrick.com/active-sessions',
    );

    const ogImageEl = document.querySelector('meta[property="og:image"]');
    expect(ogImageEl?.getAttribute('content')).toBe(
      'https://d2onetrick.com/custom-image.png',
    );
  });
});
