import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { toast } from '~/components/ui/sonner';

import { useToastNotification } from './use-toast-notification';

vi.mock('~/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function TestComponent() {
  useToastNotification();
  return <div>Test</div>;
}

describe('useToastNotification hook', () => {
  it('triggers toast.success when toast param is present in URL', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/test',
          element: <TestComponent />,
        },
      ],
      {
        initialEntries: ['/test?toast=session_deleted'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(toast.success).toHaveBeenCalledWith('Session deleted successfully');
  });

  it('triggers toast.success for loadout deletion', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/test',
          element: <TestComponent />,
        },
      ],
      {
        initialEntries: ['/test?toast=snapshot_deleted'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(toast.success).toHaveBeenCalledWith('Loadout deleted successfully');
  });
});
