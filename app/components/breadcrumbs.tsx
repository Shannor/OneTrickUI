import React from 'react';
import { Link, useLocation, useMatches, useParams } from 'react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import { useOptionalProfileData } from '~/hooks/use-route-loaders';

export interface BreadcrumbCrumb {
  label: string;
  url?: string;
}

export interface BreadcrumbContext {
  profileDisplayName?: string;
  sessionName?: string;
  loadoutName?: string;
  activityName?: string;
}

export function generateBreadcrumbs(
  pathname: string,
  _params: Record<string, string | undefined>,
  context: BreadcrumbContext | string = {},
): BreadcrumbCrumb[] {
  const ctx: BreadcrumbContext =
    typeof context === 'string' ? { profileDisplayName: context } : context;

  const cleanPath = pathname.replace(/\/$/, '') || '/';
  if (cleanPath === '/') {
    return [{ label: 'Home' }];
  }

  const crumbs: BreadcrumbCrumb[] = [{ label: 'Home', url: '/' }];
  const segments = cleanPath.split('/').filter(Boolean);

  let i = 0;
  while (i < segments.length) {
    const seg = segments[i];

    if (seg === 'sessions' && i === 0) {
      crumbs.push({ label: 'Sessions' });
      i++;
      continue;
    }

    if (seg === 'profile') {
      const userId = segments[i + 1];
      if (userId) {
        const userLabel = ctx.profileDisplayName || 'Profile';
        const profileUrl = `/profile/${userId}`;

        if (segments[i + 2] === 'c' && segments[i + 3]) {
          const charId = segments[i + 3];
          const charBaseUrl = `/profile/${userId}/c/${charId}`;

          crumbs.push({ label: userLabel, url: charBaseUrl });

          if (segments.length === 4) {
            crumbs.push({ label: 'Overview' });
            break;
          }

          crumbs.push({ label: 'Overview', url: charBaseUrl });
          i += 4;
          continue;
        } else {
          if (segments.length === 2) {
            crumbs.push({ label: userLabel });
          } else {
            crumbs.push({ label: userLabel, url: profileUrl });
          }
          i += 2;
          continue;
        }
      }
    }

    if (seg === 'sessions') {
      const nextSeg = segments[i + 1];
      if (nextSeg) {
        const parentUrl = crumbs[crumbs.length - 1]?.url || cleanPath;
        const sessionsUrl = `${parentUrl}/sessions`;
        crumbs.push({ label: 'Sessions', url: sessionsUrl });

        const sessionLabel = ctx.sessionName || 'Session';

        if (segments[i + 2] === 'metrics') {
          const sessionUrl = `${sessionsUrl}/${nextSeg}`;
          crumbs.push({ label: sessionLabel, url: sessionUrl });
          crumbs.push({ label: 'Metrics' });
          i += 3;
          continue;
        } else if (segments[i + 2] === 'loadouts') {
          const sessionUrl = `${sessionsUrl}/${nextSeg}`;
          crumbs.push({ label: sessionLabel, url: sessionUrl });
          crumbs.push({ label: 'Loadouts' });
          i += 3;
          continue;
        } else {
          crumbs.push({ label: sessionLabel });
          i += 2;
          continue;
        }
      } else {
        crumbs.push({ label: 'Sessions' });
        i++;
        continue;
      }
    }

    if (seg === 'loadouts') {
      const nextSeg = segments[i + 1];
      if (nextSeg) {
        const parentUrl = crumbs[crumbs.length - 1]?.url || cleanPath;
        const loadoutsUrl = `${parentUrl}/loadouts`;
        crumbs.push({ label: 'Loadouts', url: loadoutsUrl });

        const loadoutLabel = ctx.loadoutName || 'Loadout';

        if (segments[i + 2] === 'metrics') {
          const loadoutUrl = `${loadoutsUrl}/${nextSeg}`;
          crumbs.push({ label: loadoutLabel, url: loadoutUrl });
          crumbs.push({ label: 'Metrics' });
          i += 3;
          continue;
        } else {
          crumbs.push({ label: loadoutLabel });
          i += 2;
          continue;
        }
      } else {
        crumbs.push({ label: 'Loadouts' });
        i++;
        continue;
      }
    }

    if (seg === 'activities') {
      const actLabel = ctx.activityName || 'Game Details';
      crumbs.push({ label: actLabel });
      i += 2;
      continue;
    }

    if (seg === 'fireteam') {
      crumbs.push({ label: 'Fireteam' });
      i++;
      continue;
    }

    i++;
  }

  return crumbs;
}

export function AppBreadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const matches = useMatches();
  const profileResponse = useOptionalProfileData();

  let sessionName: string | undefined;
  let loadoutName: string | undefined;
  let activityName: string | undefined;
  let profileDisplayName: string | undefined =
    profileResponse?.profile?.displayName;

  for (const m of matches) {
    const data = (m as any).data as Record<string, any> | undefined;
    if (data) {
      if (data.session?.name) {
        sessionName = data.session.name;
      }
      if (data.snapshot?.name) {
        loadoutName = data.snapshot.name;
      }
      if (data.activityDetails?.activity?.location) {
        activityName = data.activityDetails.activity.location;
      }
      if (data.profile?.displayName) {
        profileDisplayName = data.profile.displayName;
      }
    }
  }

  const context: BreadcrumbContext = {
    profileDisplayName,
    sessionName,
    loadoutName,
    activityName,
  };

  const crumbs = generateBreadcrumbs(location.pathname, params, context);

  if (crumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className="hidden max-w-full overflow-x-auto py-0.5 text-xs sm:flex sm:text-sm">
      <BreadcrumbList className="flex-nowrap whitespace-nowrap">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;

          return (
            <React.Fragment key={`${crumb.label}-${idx}`}>
              <BreadcrumbItem className="shrink-0">
                {isLast || !crumb.url ? (
                  <BreadcrumbPage className="font-semibold text-foreground">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.url}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="shrink-0" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
