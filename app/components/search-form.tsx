import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Form, useNavigate } from 'react-router';
import { LoadingButton } from '~/components/loading-button';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

export interface SearchFormProps {
  query: string;
  isLoading?: boolean;
}

export function SearchForm({ query, isLoading = false }: SearchFormProps) {
  const [value, setValue] = useState(query);
  const navigate = useNavigate();

  useEffect(() => {
    setValue(query);
  }, [query]);

  const handleClear = () => {
    setValue('');
    if (query) {
      navigate('/search');
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <Form
        method="get"
        action="/search"
        role="search"
        className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            name="q"
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Search Bungie Name (e.g. Guardian#1234)..."
            aria-label="Search Guardians by Bungie Name"
            autoComplete="off"
            spellCheck={false}
            className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Searching..."
          className="w-full shrink-0 sm:w-auto"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </LoadingButton>
      </Form>
      <p className="text-xs text-muted-foreground sm:text-sm">
        Searches both 1 Trick and Bungie Global Names. Enter a name or full
        Bungie Name with discriminator (Name#1234).
      </p>
    </div>
  );
}
