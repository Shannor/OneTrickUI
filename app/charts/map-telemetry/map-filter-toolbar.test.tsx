import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  MapFilterToolbar,
  MapMobileFilterTabs,
  MapPaginationFooter,
} from './map-filter-toolbar';
import { buildMapFilterTabs } from './map-telemetry-types';

const tabs = buildMapFilterTabs({ total: 10, strong: 3, swap: 2, multi: 6 });

describe('MapFilterToolbar, MapMobileFilterTabs, and MapPaginationFooter', () => {
  it('fires search and desktop filter callbacks in MapFilterToolbar', () => {
    const onSearchChange = vi.fn();
    const onFilterChange = vi.fn();

    render(
      <MapFilterToolbar
        title="Map Telemetry"
        description="Swap insights"
        sortBy="count"
        onSortChange={vi.fn()}
        searchQuery=""
        onSearchChange={onSearchChange}
        filter="all"
        onFilterChange={onFilterChange}
        filterTabs={tabs}
      />,
    );

    fireEvent.change(screen.getByLabelText('Search maps'), {
      target: { value: 'eternity' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('eternity');

    fireEvent.click(screen.getByRole('tab', { name: 'Strong (3)' }));
    expect(onFilterChange).toHaveBeenCalledWith('strong');
  });

  it('renders mobile filter tabs and notifies on selection', () => {
    const onFilterChange = vi.fn();
    render(
      <MapMobileFilterTabs
        filter="all"
        onFilterChange={onFilterChange}
        filterTabs={tabs}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Swap (2)' }));
    expect(onFilterChange).toHaveBeenCalledWith('swap');
  });

  it('hides pagination when totalItems <= pageSize and navigates pages when > pageSize', () => {
    const onPageChange = vi.fn();
    const { container, rerender } = render(
      <MapPaginationFooter
        page={1}
        totalPages={1}
        pageSize={7}
        totalItems={5}
        onPageChange={onPageChange}
      />,
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <MapPaginationFooter
        page={1}
        totalPages={2}
        pageSize={7}
        totalItems={10}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous map page' }),
    ).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Next map page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
