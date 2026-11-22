import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SearchPagination, buildSearchPageUrl } from './search-pagination';

describe('buildSearchPageUrl', () => {
  it('omits page param when target page is 0', () => {
    expect(buildSearchPageUrl('Weegee#1234', 0)).toBe(
      '/search?q=Weegee%231234',
    );
  });

  it('includes page param when target page is greater than 0', () => {
    expect(buildSearchPageUrl('Weegee', 2)).toBe('/search?q=Weegee&page=2');
  });
});

describe('SearchPagination', () => {
  it('renders nothing when on page 0 with no more results', () => {
    const { container } = render(
      <MemoryRouter>
        <SearchPagination query="Weegee" page={0} hasMore={false} />
      </MemoryRouter>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('disables Previous button on page 0 and renders Next link when hasMore is true', () => {
    render(
      <MemoryRouter>
        <SearchPagination query="Guardian" page={0} hasMore={true} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    const nextLink = screen.getByRole('link', { name: /next/i });
    expect(nextLink).toHaveAttribute('href', '/search?q=Guardian&page=1');
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('renders Previous link and disables Next button on last page', () => {
    render(
      <MemoryRouter>
        <SearchPagination query="Guardian" page={2} hasMore={false} />
      </MemoryRouter>,
    );

    const prevLink = screen.getByRole('link', { name: /previous/i });
    expect(prevLink).toHaveAttribute('href', '/search?q=Guardian&page=1');
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    expect(screen.getByText('Page 3')).toBeInTheDocument();
  });
});
