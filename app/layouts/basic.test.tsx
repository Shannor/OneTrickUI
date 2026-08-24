import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Theme, ThemeProvider } from 'remix-themes';
import { describe, expect, it } from 'vitest';

import { Basic } from './basic';

describe('Basic Layout Header', () => {
  it('renders logo and name inside a clickable link to root', () => {
    render(
      <MemoryRouter>
        <ThemeProvider
          specifiedTheme={Theme.LIGHT}
          themeAction="/action/set-theme"
        >
          <Basic />
        </ThemeProvider>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /1 trick/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');

    const logos = screen.getAllByAltText('OneTrick logo');
    expect(logos).toHaveLength(2);
    logos.forEach((logo) => {
      expect(link).toContainElement(logo);
    });

    expect(screen.getByText('Trick')).toBeInTheDocument();
  });
});
