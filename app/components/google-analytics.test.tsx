import { render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GOOGLE_ANALYTICS_ID, GoogleAnalytics } from './google-analytics';

describe('GoogleAnalytics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    document
      .querySelectorAll('script[src*="googletagmanager.com"]')
      .forEach((script) => script.remove());
  });

  it('renders nothing outside production by default', () => {
    const html = renderToStaticMarkup(
      <head>
        <GoogleAnalytics />
      </head>,
    );

    expect(html).toBe('<head></head>');
  });

  it('renders the Google Tag Manager async script and gtag init script in production SSR markup', () => {
    vi.stubEnv('PROD', true);

    const html = renderToStaticMarkup(
      <head>
        <GoogleAnalytics />
      </head>,
    );

    expect(html).toContain(
      `<script async="" src="https://www.googletagmanager.com/gtm.js?id=${GOOGLE_ANALYTICS_ID}"></script>`,
    );
    expect(html).toContain('window.dataLayer = window.dataLayer || [];');
    expect(html).toContain('function gtag(){dataLayer.push(arguments);}');
    expect(html).toContain("gtag('js', new Date());");
  });

  it('supports a custom measurementId when enabled', () => {
    const html = renderToStaticMarkup(
      <head>
        <GoogleAnalytics enabled measurementId="G-CUSTOM1234" />
      </head>,
    );

    expect(html).toContain(
      'src="https://www.googletagmanager.com/gtm.js?id=G-CUSTOM1234"',
    );
  });

  it('renders nothing when explicitly disabled even in production', () => {
    vi.stubEnv('PROD', true);

    const html = renderToStaticMarkup(
      <head>
        <GoogleAnalytics enabled={false} />
      </head>,
    );

    expect(html).toBe('<head></head>');
  });

  it('renders nothing when measurementId is empty', () => {
    const { container } = render(<GoogleAnalytics enabled measurementId="" />);

    expect(container.innerHTML).toBe('');
    expect(
      document.querySelector('script[src*="googletagmanager.com"]'),
    ).toBeNull();
  });
});
