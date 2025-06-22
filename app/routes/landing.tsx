import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import {
  Form,
  Link,
  redirect,
  useFetcher,
  useLoaderData,
  useNavigate,
} from 'react-router';
import { type SearchUserResult, search } from '~/api';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const value = formData.get('query');
  if (!value) {
    return { error: 'missing search term' };
  }
  const v = value.toString();
  return redirect(`/public?query=${value}&page=${0}`);
  // const { data, error } = await search({
  //   body: {
  //     page: 0,
  //     prefix: v,
  //   },
  // });
  // if (error) {
  //   return { error: error };
  // }
  // if (!data) {
  //   return { results: [], hasMore: false, search: v };
  // }
  // return {
  //   results: data.results,
  //   hasMore: data.hasMore,
  //   error: undefined,
  //   search: v,
  // };
}

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

export default function Landing() {
  const { data, page, query } = useLoaderData<typeof loader>();

  const { Form } = useFetcher<typeof action>();
  const results = data?.results ?? [];
  const hasMore = data?.hasMore ?? false;
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Search for a Friend
          </h2>
          <Form
            method="post"
            className="mt-4 flex w-full max-w-sm items-center gap-2"
          >
            <Input
              type="text"
              placeholder="Search..."
              name="query"
              defaultValue={query}
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </Form>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
          {results.map((data) => (
            <UserCard key={data.bungieMembershipId} user={data} />
          ))}
        </div>
        <div className="flex flex-row justify-between gap-4 self-end">
          <Button disabled={page === 0} variant="outline">
            <ChevronLeft />
            <Link to={`/public?page=${page - 1}&query=${query}`}>
              {' '}
              Previous Page
            </Link>
          </Button>
          <Button disabled={!hasMore} variant="outline">
            <Link to={`/public?page=${page + 1}&query=${query}`}>
              Next Page
            </Link>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: SearchUserResult }): React.ReactNode {
  return (
    <Card className="cursor-pointer">
      <CardHeader className="flex flex-col">
        <div className="flex flex-row items-baseline gap-1">
          <CardTitle>{user.displayName}</CardTitle>
          <div className="text-muted-foreground">#{user.nameCode}</div>
        </div>
        <CardDescription>
          <div>Bungie Id: {user.bungieMembershipId}</div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-4">
          {user.memberships.map((ship) => {
            return (
              <div className="flex flex-row gap-1">
                {ship.iconPath && (
                  <img
                    alt="source icon"
                    src={ship.iconPath}
                    className="h-6 w-6"
                  />
                )}
                <div>{ship.displayName}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
