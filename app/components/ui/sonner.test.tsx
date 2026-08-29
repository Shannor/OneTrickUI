import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Theme, ThemeProvider } from 'remix-themes';
import { describe, expect, it } from 'vitest';

import { Toaster, toast } from './sonner';

describe('Sonner Toaster component', () => {
  it('exports toast helper and renders Toaster component', () => {
    expect(toast).toBeDefined();

    const { container } = render(
      <ThemeProvider
        specifiedTheme={Theme.DARK}
        themeAction="/action/set-theme"
      >
        <Toaster />
      </ThemeProvider>,
    );

    expect(container).toBeInTheDocument();
  });
});
