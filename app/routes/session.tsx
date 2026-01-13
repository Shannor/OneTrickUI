import { doc, onSnapshot } from '@firebase/firestore';
import { format } from 'date-fns';
import { Share2, StopCircleIcon } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Form,
  NavLink,
  Outlet,
  useFetcher,
  useLocation,
  useRevalidator,
} from 'react-router';
import { getSession, getSessionAggregates } from '~/api';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Textarea } from '~/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { useProfileData } from '~/hooks/use-route-loaders';
import { db } from '~/lib/firebaseConfig';

import type { Route } from './+types/session';

export async function loader({ params }: Route.LoaderArgs) {
  const { sessionId, id, characterId } = params;
  const res = await getSession({
    path: {
      sessionId,
    },
  });

  if (!res.data) {
    return { session: undefined, error: 'Session Not Found' };
  }
  const aggRes = await getSessionAggregates({
    path: {
      sessionId,
    },
  });

  const sharablePath = `profile/${id}/c/${characterId}/sessions/${sessionId}`;
  let path: string;
  if (process.env.NODE_ENV === 'development') {
    path = `https://local.d2onetrick.ngrok.app/${sharablePath}`;
  } else {
    path = `https://d2onetrick.com/${sharablePath}`;
  }
  if (!aggRes.data) {
    return {
      session: res.data,
      aggregates: [],
      snapshots: {},
      error: undefined,
      path,
    };
  }
  return {
    session: res.data,
    aggregates: aggRes.data.aggregates,
    snapshots: aggRes.data.snapshots,
    error: undefined,
    path,
  };
}

type ISession = Awaited<ReturnType<typeof getSession>>;

export default function Session({ loaderData, params }: Route.ComponentProps) {
  const { profile, type } = useProfileData();
  const { session, error, path } = loaderData;
  const { characterId } = params;
  const isOwner = type === 'owner';
  const { state, Form } = useFetcher();
  const isSubmitting = state === 'submitting';
  const revalidator = useRevalidator();

  const location = useLocation();

  const currentTab = useMemo(() => {
    const tabPatterns = {
      metrics: /\/metrics\/?$/,
      loadouts: /\/loadouts\/?$/,
      games: /.*/,
    };

    return (
      Object.entries(tabPatterns).find(([_, pattern]) =>
        pattern.test(location.pathname),
      )?.[0] ?? 'games'
    );
  }, [location.pathname]);

  useEffect(() => {
    // Listen for real-time updates from Firestore
    if (!session) return;
    if (session.status == 'pending') {
      const unsubscribe = onSnapshot(
        doc(db, 'sessions', session.id),
        (snapshot) => {
          const newData = snapshot.data() as ISession['data'];
          if (!newData) return;
          if (!session.aggregateIds?.length) return;
          if (
            newData.status == 'complete' ||
            newData.aggregateIds.length !== session.aggregateIds?.length
          ) {
            revalidator
              .revalidate()
              .then(() => console.log('firestore updated'));
          }
        },
      );
      return () => {
        unsubscribe();
      };
    }
    // Clean up the listener when the component unmounts
  }, [revalidator]);

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <Empty
          title="No Session Found"
          description="Error loading this session. Please try again later."
        />
      </div>
    );
  }

  if (error) {
    console.error(error);
    return (
      <div>
        <Empty
          title="Error loading Session"
          description="Error loading this session. Please try again later."
        />
      </div>
    );
  }

  const isCurrent = session.status === 'pending';

  const [copyStatus, setCopyStatus] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(path);
      setCopyStatus('Copied!');
    } catch (err) {
      setCopyStatus('Failed to copy!');
      console.error('Failed to copy text: ', err);
    }
    setTimeout(() => setCopyStatus(''), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <title>{`${session.name} - ${profile?.displayName} `}</title>
      <meta
        property="og:title"
        content={`${session.name} - ${profile?.displayName} `}
      />
      <meta
        name="description"
        content={`View games, metrics, and details for ${profile?.displayName ?? ''}'s session ${session.name}.`}
      />
      <div className="flex w-full flex-col items-start gap-4 p-4">
        {isCurrent && <Badge className="animate-pulse">Active</Badge>}
        <div className="flex w-full flex-row gap-4">
          <Form
            method="post"
            action="/action/update-session"
            className="flex w-full flex-col gap-4 lg:w-1/3"
          >
            <Input
              name="name"
              defaultValue={session.name ?? ''}
              className="h-auto scroll-m-20 border-none bg-transparent px-1 py-2 text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-3xl"
            />
            <input type="hidden" name="sessionId" value={session.id} />
            <Textarea
              name="description"
              placeholder="Add a description..."
              className="w-full"
              defaultValue={session.description}
            />
            <LoadingButton type="submit">Save</LoadingButton>
          </Form>
        </div>
        {isOwner && isCurrent && (
          <div className="flex flex-row gap-4">
            <Form method="post" action="/action/end-session">
              <input type="hidden" name="characterId" value={characterId} />
              <input type="hidden" name="sessionId" value={session.id} />
              <LoadingButton
                type="submit"
                variant="outline"
                disabled={!characterId || isSubmitting}
                isLoading={isSubmitting}
                className={`${isSubmitting ? 'opacity-50' : ''}`}
              >
                <StopCircleIcon className="h-4 w-4" />
                Stop Session
              </LoadingButton>
            </Form>
          </div>
        )}
        <Tooltip open={Boolean(copyStatus)}>
          <TooltipContent>{copyStatus}</TooltipContent>
          <TooltipTrigger asChild>
            <Button onClick={handleCopy} variant="outline">
              <Share2 className="h-6 w-6" /> Share
            </Button>
          </TooltipTrigger>
        </Tooltip>
        <Tabs value={currentTab}>
          <TabsList>
            <TabsTrigger value="games" asChild>
              <NavLink to="." end>
                Games
              </NavLink>
            </TabsTrigger>
            <TabsTrigger value="metrics" asChild>
              <NavLink to="metrics">Metrics</NavLink>
            </TabsTrigger>
            <TabsTrigger value="loadouts" asChild>
              <NavLink to="loadouts">Loadouts</NavLink>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="text-sm text-muted-foreground">
          {format(session.startedAt, 'MM/dd/yyyy - p')}
          {session.completedAt
            ? ` - ${format(session.completedAt, 'MM/dd/yyyy - p')}`
            : ''}
        </div>
      </div>
      <div className="w-full overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}
