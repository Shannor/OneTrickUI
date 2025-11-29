import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import {
  Form,
  Link,
  useLoaderData,
  useLocation,
  useNavigate,
} from 'react-router';
import { type SearchUserResult, search } from '~/api';
import { LoadingButton } from '~/components/loading-button';
import { NavLoading } from '~/components/nav-loading';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useIsNavigating } from '~/hooks/use-route-loaders';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions';

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const page = Number(url.searchParams.get('page') || '0');
  const query = url.searchParams.get('query') || '';
  if (query) {
    const { data, error } = await search({
      body: {
        page,
        prefix: query,
      },
    });
    return { data, error, page, query };
  }
  return { page, query };
}

export default function Search() {
  const { data, page, query } = useLoaderData<typeof loader>();

  const results = data?.results ?? [];
  const hasMore = data?.hasMore ?? false;
  const navigate = useNavigate();
  const [isLoading] = useIsNavigating();
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="flex w-full max-w-[1080px] flex-col gap-8">
      <title>{`Search${query ? `: ${query}` : ''}`}</title>
      <meta
        property="og:title"
        content={`Search${query ? `: ${query}` : ''}`}
      />
      <meta
        name="description"
        content={`Search One Trick for Destiny 2 players${query ? ` matching "${query}"` : ''}.`}
      />
      <div className="flex flex-col justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0">
            Search for a Friend
          </h2>
          <Form className="mt-4 flex w-full max-w-sm items-center gap-2">
            <Input
              type="text"
              placeholder="Search..."
              name="query"
              defaultValue={query}
            />
            <LoadingButton
              type="submit"
              variant="outline"
              isLoading={isLoading}
            >
              Search
            </LoadingButton>
          </Form>
        </div>

        <NavLoading>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
            {results.map((data) => (
              <UserCard
                key={data.objectId}
                user={data}
                onClick={() => {
                  navigate(`/profile/${data.objectId}`);
                }}
              />
            ))}
          </div>
        </NavLoading>
        {query !== '' && (
          <div className="flex flex-row justify-between gap-4 self-end">
            <Button disabled={page === 0} variant="outline">
              <ChevronLeft />
              <Link to={`${pathname}?page=${page - 1}&query=${query}`}>
                Previous Page
              </Link>
            </Button>
            <Button disabled={!hasMore} variant="outline">
              <Link to={`${pathname}?page=${page + 1}&query=${query}`}>
                Next Page
              </Link>
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({
  user,
  onClick,
}: {
  user: SearchUserResult;
  onClick: () => void;
}): React.ReactNode {
  return (
    <Card className="cursor-pointer" onClick={onClick}>
      <CardHeader className="flex flex-col">
        <div className="flex flex-row items-baseline gap-1">
          <CardTitle>{user.uniqueName}</CardTitle>
        </div>
        <CardDescription>
          <div>Bungie Id: {user.bungieId}</div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-4">
          {user.alternateNames.map((ship) => {
            return <div>{ship}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
