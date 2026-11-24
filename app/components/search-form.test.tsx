import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SearchForm } from './search-form';

function renderSearchForm(query: string, isLoading = false) {
  const router = createMemoryRouter(
    [
      {
        path: '/search',
        element: <SearchForm query={query} isLoading={isLoading} />,
      },
    ],
    {
      initialEntries: [
        query ? `/search?q=${encodeURIComponent(query)}` : '/search',
      ],
    },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

describe('SearchForm', () => {
  it('renders search input, submit button, and helper text', () => {
    renderSearchForm('');

    const input = screen.getByRole('searchbox', {
      name: /search guardians by bungie name/i,
    });
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('name', 'q');
    expect(screen.getByRole('button', { name: /^search$/i })).toBeEnabled();
    expect(
      screen.getByText(/searches both 1 trick and bungie global names/i),
    ).toBeInTheDocument();
  });

  it('shows clear button when query has value and clears input on click', () => {
    renderSearchForm('Weegee#1234');

    const input = screen.getByRole('searchbox', {
      name: /search guardians by bungie name/i,
    });
    expect(input).toHaveValue('Weegee#1234');

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');
  });

  it('disables submit button while loading', () => {
    renderSearchForm('Weegee', true);

    const submitButton = screen.getByRole('button', { name: /searching/i });
    expect(submitButton).toBeDisabled();
  });

  it('updates input value when the query prop changes and does not resurrect stale drafts on back navigation', () => {
    function Harness() {
      const [query, setQuery] = useState('Initial');
      return (
        <>
          <SearchForm query={query} />
          <button type="button" onClick={() => setQuery('Updated')}>
            Change Query
          </button>
          <button type="button" onClick={() => setQuery('Initial')}>
            Back To Initial
          </button>
        </>
      );
    }

    const router = createMemoryRouter(
      [
        {
          path: '/search',
          element: <Harness />,
        },
      ],
      { initialEntries: ['/search?q=Initial'] },
    );

    render(<RouterProvider router={router} />);
    const input = screen.getByRole('searchbox', {
      name: /search guardians by bungie name/i,
    });

    fireEvent.change(input, { target: { value: 'Unsaved Draft' } });
    expect(input).toHaveValue('Unsaved Draft');

    fireEvent.click(screen.getByRole('button', { name: /change query/i }));
    expect(input).toHaveValue('Updated');

    fireEvent.click(screen.getByRole('button', { name: /back to initial/i }));
    expect(input).toHaveValue('Initial');
  });
});
