import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FormLabel } from './label';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders an accessible switch and toggles checked state on click', () => {
    const onCheckedChange = vi.fn();

    render(
      <div>
        <Switch
          id="cleanup-toggle"
          defaultChecked={false}
          onCheckedChange={onCheckedChange}
        />
        <FormLabel htmlFor="cleanup-toggle">Has Similar Loadouts</FormLabel>
      </div>,
    );

    const toggle = screen.getByRole('switch', {
      name: /has similar loadouts/i,
    });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('prevents toggling when disabled', () => {
    const onCheckedChange = vi.fn();

    render(
      <Switch
        aria-label="Disabled toggle"
        disabled
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    const toggle = screen.getByRole('switch', { name: 'Disabled toggle' });
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
