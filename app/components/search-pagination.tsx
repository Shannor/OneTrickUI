import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';

export interface SearchPaginationProps {
  query: string;
  page: number;
  hasMore: boolean;
}

export function buildSearchPageUrl(query: string, targetPage: number): string {
  const params = new URLSearchParams();
  if (query) {
    params.set('q', query);
  }
  if (targetPage > 0) {
    params.set('page', String(targetPage));
  }
  const searchStr = params.toString();
  return searchStr ? `/search?${searchStr}` : '/search';
}

export function SearchPagination({
  query,
  page,
  hasMore,
}: SearchPaginationProps) {
  if (page === 0 && !hasMore) {
    return null;
  }

  return (
    <nav
      aria-label="Search pagination"
      className="flex items-center justify-between gap-3 border-t pt-4"
    >
      {page > 0 ? (
        <Button asChild variant="outline" size="sm">
          <Link to={buildSearchPageUrl(query, page - 1)}>
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
      )}

      <span className="text-xs font-medium text-muted-foreground sm:text-sm">
        Page {page + 1}
      </span>

      {hasMore ? (
        <Button asChild variant="outline" size="sm">
          <Link to={buildSearchPageUrl(query, page + 1)}>
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
