import { AlertCircle, LogIn, Search as SearchIcon, Users } from 'lucide-react';
import { Link, useNavigation } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { type SearchUserResult, search } from '~/api';
import { SearchForm } from '~/components/search-form';
import {
  SearchPagination,
  buildSearchPageUrl,
} from '~/components/search-pagination';
import { SearchResultItem } from '~/components/search-result-item';
import { ShareSiteButton } from '~/components/share-site-button';
import { Button } from '~/components/ui/button';
import { getSiteOrigin } from '~/lib/utils';

import type { Route } from './+types/search';

export interface SearchLoaderData {
  query: string;
  page: number;
  results: SearchUserResult[];
  hasMore: boolean;
  isSignedIn: boolean;
  currentUserId?: string;
  errorMessage?: string;
}

export async function loader({
  request,
  context,
}: Route.LoaderArgs): Promise<SearchLoaderData> {
  const log = getRequestLogger(context);
  const url = new URL(request.url);
  const rawQuery =
    url.searchParams.get('q') ?? url.searchParams.get('query') ?? '';
  const query = rawQuery.trim();
  const parsedPage = Number.parseInt(url.searchParams.get('page') ?? '0', 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0;

  const searchPromise = query
    ? search({ body: { prefix: query, page } }).catch((err) => ({
        data: undefined,
        error: err,
        response: undefined,
      }))
    : Promise.resolve(undefined);

  const [auth, searchResponse] = await Promise.all([
    getAuth(request),
    searchPromise,
  ]);

  const isSignedIn = Boolean(auth);
  const currentUserId = auth?.id;

  if (!query) {
    log.set({
      route: 'routes/search',
      user: { authenticated: isSignedIn, id: currentUserId },
      search: {
        hasQuery: false,
        queryLength: 0,
        hasDiscriminator: false,
        page,
        resultCount: 0,
        recordedCount: 0,
        hasMore: false,
      },
    });
    return {
      query,
      page,
      results: [],
      hasMore: false,
      isSignedIn,
      currentUserId,
    };
  }

  if (!searchResponse || searchResponse.error || !searchResponse.data) {
    log.set({
      route: 'routes/search',
      user: { authenticated: isSignedIn, id: currentUserId },
      search: {
        hasQuery: true,
        queryLength: query.length,
        hasDiscriminator: query.includes('#'),
        page,
        resultCount: 0,
        recordedCount: 0,
        hasMore: false,
      },
    });
    const searchError = searchResponse?.error;
    log.error(
      searchError instanceof Error
        ? searchError
        : 'Player search request failed',
      {
        search: {
          page,
          queryLength: query.length,
          status: searchResponse?.response?.status,
          ...(searchError && !(searchError instanceof Error)
            ? { apiError: searchError }
            : {}),
        },
      },
    );
    return {
      query,
      page,
      results: [],
      hasMore: false,
      isSignedIn,
      currentUserId,
      errorMessage: 'Unable to search Guardians right now. Please try again.',
    };
  }

  const results = Array.isArray(searchResponse.data.results)
    ? searchResponse.data.results
    : [];
  const hasMore = Boolean(searchResponse.data.hasMore);

  log.set({
    route: 'routes/search',
    user: { authenticated: isSignedIn, id: currentUserId },
    search: {
      hasQuery: true,
      queryLength: query.length,
      hasDiscriminator: query.includes('#'),
      page,
      resultCount: results.length,
      recordedCount: results.filter((r) => r.isRecorded && Boolean(r.userId))
        .length,
      hasMore,
    },
  });

  return {
    query,
    page,
    results,
    hasMore,
    isSignedIn,
    currentUserId,
  };
}

export function SearchPageHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
        <SearchIcon className="h-7 w-7 shrink-0 text-primary sm:h-8 sm:w-8" />
        <span>Search Guardians</span>
      </h1>
      <p className="text-sm text-muted-foreground sm:text-base">
        Find Guardians by Bungie Name to inspect recorded PvP sessions and
        loadout snapshots on 1 Trick.
      </p>
    </div>
  );
}

export function SearchInitialPrompt({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed bg-card/40 px-6 py-10 text-center">
      <Users
        aria-hidden="true"
        className="mb-4 h-11 w-11 text-muted-foreground/60"
      />
      <h2 className="text-lg font-semibold sm:text-xl">
        Look up any Destiny 2 Guardian
      </h2>
      <p className="mt-2 max-w-lg text-balance text-sm text-muted-foreground">
        Enter a Bungie Name above to jump straight into recorded 1 Trick
        profiles, or invite friends who have not started recording yet.
      </p>
      <div className="mt-6 flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:flex-row">
        {!isSignedIn && (
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              <span>Start Recording</span>
            </Link>
          </Button>
        )}
        <ShareSiteButton
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );
}

export function SearchErrorBanner({
  message,
  query,
  page = 0,
}: {
  message: string;
  query: string;
  page?: number;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{message}</p>
      </div>
      {query && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full shrink-0 border-destructive/30 text-foreground sm:w-auto"
        >
          <Link to={buildSearchPageUrl(query, page)}>Try Again</Link>
        </Button>
      )}
    </div>
  );
}

export function SearchNoResults({
  query,
  isSignedIn,
}: {
  query: string;
  isSignedIn: boolean;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed bg-card/40 px-6 py-10 text-center">
      <SearchIcon
        aria-hidden="true"
        className="mb-4 h-11 w-11 text-muted-foreground/60"
      />
      <h2 className="text-lg font-semibold sm:text-xl">
        No Guardians found for &ldquo;{query}&rdquo;
      </h2>
      <p className="mt-2 max-w-lg text-balance text-sm text-muted-foreground">
        Double-check the Bungie Name spelling or include the four-digit
        discriminator (e.g. Guardian#1234). 1 Trick only supports profiles for
        Guardians who have recorded their data in our system.
      </p>
      <div className="mt-6 flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:flex-row">
        {!isSignedIn && (
          <Button
            asChild
            variant="default"
            size="sm"
            className="w-full sm:w-auto"
          >
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              <span>Start Recording</span>
            </Link>
          </Button>
        )}
        <ShareSiteButton
          variant={isSignedIn ? 'default' : 'outline'}
          size="sm"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );
}

export function SearchResultsSummary({
  query,
  results,
  page,
}: {
  query: string;
  results: SearchUserResult[];
  page: number;
}) {
  const recordedCount = results.filter((r) => r.isRecorded && r.userId).length;
  const totalCount = results.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs text-muted-foreground sm:text-sm">
      <p>
        Showing{' '}
        <span className="font-semibold text-foreground">{totalCount}</span>{' '}
        {totalCount === 1 ? 'Guardian' : 'Guardians'} for{' '}
        <span className="font-semibold text-foreground">
          &ldquo;{query}&rdquo;
        </span>
        {recordedCount > 0 ? ` (${recordedCount} recorded on 1 Trick)` : ''}
      </p>
      {page > 0 ? <span>Page {page + 1}</span> : null}
    </div>
  );
}

export function Search({ loaderData }: Route.ComponentProps) {
  const { query, page, results, hasMore, isSignedIn, errorMessage } =
    loaderData;
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' && navigation.location?.pathname === '/search';

  const origin = getSiteOrigin();
  const pageTitle = query
    ? `Search "${query}" | 1 Trick`
    : 'Search Guardians | 1 Trick';
  const pageDescription =
    'Search Destiny 2 Guardians by Bungie Name to inspect recorded PvP sessions and loadout snapshots on 1 Trick.';
  const canonicalUrl = 'https://d2onetrick.com/search';

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-2 sm:gap-8">
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${origin}/og-image.png`} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={`${origin}/twitter-image.png`} />
      <link rel="canonical" href={canonicalUrl} />

      <SearchPageHeader />

      <div className="w-full max-w-2xl">
        <SearchForm query={query} isLoading={isSearching} />
      </div>

      {errorMessage ? (
        <SearchErrorBanner message={errorMessage} query={query} page={page} />
      ) : !query ? (
        <SearchInitialPrompt isSignedIn={isSignedIn} />
      ) : results.length === 0 ? (
        <SearchNoResults query={query} isSignedIn={isSignedIn} />
      ) : (
        <div
          aria-busy={isSearching}
          className={`flex flex-col gap-4 transition-opacity duration-150 ${isSearching ? 'opacity-60' : ''}`}
        >
          <SearchResultsSummary query={query} results={results} page={page} />
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
            {results.map((result, idx) => (
              <SearchResultItem
                key={`${result.userId ?? result.primaryMembershipId}-${result.uniqueName || result.displayName}-${idx}`}
                result={result}
                isSignedIn={isSignedIn}
              />
            ))}
          </div>
          <SearchPagination query={query} page={page} hasMore={hasMore} />
        </div>
      )}
    </div>
  );
}

export default Search;
