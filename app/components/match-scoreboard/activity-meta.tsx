import type { ActivityHistory } from '~/api';
import { getSiteOrigin, setBungieUrl } from '~/lib/utils';

export interface ActivityMetaProps {
  activity?: ActivityHistory;
  userId?: string;
  characterId?: string;
  instanceId?: string;
}

export function ActivityMeta({
  activity,
  userId,
  characterId,
  instanceId,
}: ActivityMetaProps) {
  const origin = getSiteOrigin();

  if (!activity) {
    return (
      <>
        <title>Activity Not Found | 1 Trick</title>
        <meta
          name="description"
          content="We couldn't find this activity report on 1 Trick."
        />
      </>
    );
  }

  const modeSuffix = activity.mode ? ` • ${activity.mode}` : '';
  const pageTitle = `${activity.location} - ${activity.activity}${modeSuffix} | 1 Trick`;
  const modeInText = activity.mode ? ` in ${activity.mode}` : '';
  const pageDescription = `Post-game report for ${activity.activity}${modeInText} at ${activity.location} on 1 Trick.`;
  const canonicalUrl =
    userId && characterId && instanceId
      ? `https://d2onetrick.com/profile/${userId}/c/${characterId}/activities/${instanceId}`
      : '';
  const shareImageUrl = activity.imageUrl
    ? setBungieUrl(activity.imageUrl)
    : `${origin}/og-image.png`;

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={shareImageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={shareImageUrl} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </>
  );
}
