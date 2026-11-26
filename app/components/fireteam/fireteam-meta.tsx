import { getSiteOrigin } from '~/lib/utils';

export interface FireteamMetaProps {
  id?: string;
  characterId?: string;
}

export function FireteamMeta({ id, characterId }: FireteamMetaProps) {
  const origin = getSiteOrigin();
  const pageTitle = 'Fireteam | 1 Trick';
  const pageDescription =
    'View your current fireteam and manage active character selections on 1 Trick.';
  const canonicalUrl =
    id && characterId
      ? `${origin}/profile/${id}/c/${characterId}/fireteam`
      : '';

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={`${origin}/og-image.png`} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={`${origin}/twitter-image.png`} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </>
  );
}
