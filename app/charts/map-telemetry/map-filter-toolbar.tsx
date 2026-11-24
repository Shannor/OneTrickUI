import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { cn } from '~/lib/utils';

import type {
  MapFilterTab,
  MapFilterTabOption,
  MapSortKey,
} from './map-telemetry-types';

export interface MapFilterToolbarProps {
  title: string;
  description: string;
  sortBy: MapSortKey;
  onSortChange: (sortBy: MapSortKey) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: MapFilterTab;
  onFilterChange: (filter: MapFilterTab) => void;
  filterTabs: MapFilterTabOption[];
}

export function MapFilterToolbar({
  title,
  description,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  filterTabs,
}: MapFilterToolbarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:border-b md:border-border md:px-5 md:py-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="font-heading text-lg font-semibold tracking-wide text-foreground sm:text-xl">
            {title}
          </h4>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {description}
          </p>
        </div>

        <div className="w-[132px] md:hidden">
          <Select
            value={sortBy}
            onValueChange={(val) => onSortChange(val as MapSortKey)}
          >
            <SelectTrigger aria-label="Sort maps" className="h-8 text-xs">
              <SelectValue placeholder="Sort: Games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Sort: Games</SelectItem>
              <SelectItem value="kd">Sort: K/D</SelectItem>
              <SelectItem value="winPct">Sort: Win %</SelectItem>
              <SelectItem value="kda">Sort: Efficiency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-44">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search map..."
            aria-label="Search maps"
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filter maps by performance signal"
          className="hidden items-center gap-1 rounded-lg border border-border bg-secondary/40 p-0.5 md:inline-flex"
        >
          {filterTabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilterChange(tab.key)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'bg-secondary font-semibold text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export interface MapMobileFilterTabsProps {
  filter: MapFilterTab;
  onFilterChange: (filter: MapFilterTab) => void;
  filterTabs: MapFilterTabOption[];
}

export function MapMobileFilterTabs({
  filter,
  onFilterChange,
  filterTabs,
}: MapMobileFilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Mobile map signal filter"
      className="flex items-center gap-4 border-b border-border md:hidden"
    >
      {filterTabs.map((tab) => {
        const active = filter === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onFilterChange(tab.key)}
            className={cn(
              'border-b-2 pb-2 text-xs transition-colors',
              active
                ? 'border-b-primary font-semibold text-foreground'
                : 'border-b-transparent text-muted-foreground',
            )}
          >
            {tab.mobileLabel}
          </button>
        );
      })}
    </div>
  );
}

export interface MapPaginationFooterProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function MapPaginationFooter({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
}: MapPaginationFooterProps) {
  if (totalItems <= pageSize) {
    return null;
  }

  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground md:px-5 md:py-3">
      <span>
        Showing{' '}
        <strong className="font-semibold text-foreground">
          {startIdx + 1}–{endIdx}
        </strong>{' '}
        of{' '}
        <strong className="font-semibold text-foreground">{totalItems}</strong>{' '}
        maps
      </span>

      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Previous map page"
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>
        <span className="px-2 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          aria-label="Next map page"
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:pointer-events-none disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
