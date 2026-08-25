import React from 'react';
import { resolveUrl } from '~/lib/seo';

export interface SeoMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
}

const DEFAULT_TITLE = 'One Trick — Destiny 2 PvP Loadout & Session Tracker';
const DEFAULT_DESCRIPTION =
  'Track your Destiny 2 PvP performance across game modes, analyze real-time sessions, and inspect community loadout snapshots.';
const DEFAULT_KEYWORDS =
  'destiny, destiny 2, d2, one trick, tracker, destiny pvp, pvp, loadouts, sessions, stats, min-max';
const DEFAULT_SITE_NAME = 'One Trick';
const DEFAULT_OG_IMAGE = 'https://d2onetrick.com/og-image.svg';
const DEFAULT_TWITTER_IMAGE = 'https://d2onetrick.com/twitter-image.svg';
const DEFAULT_IMAGE_ALT = 'One Trick - Destiny 2 PvP Tracker';

export function SeoMeta({
  title: customTitle,
  description: customDescription,
  keywords = DEFAULT_KEYWORDS,
  url,
  image,
  imageAlt = DEFAULT_IMAGE_ALT,
  type = 'website',
  noindex = false,
}: SeoMetaProps) {
  const title = customTitle ? customTitle : DEFAULT_TITLE;
  const description = customDescription
    ? customDescription
    : DEFAULT_DESCRIPTION;
  const canonicalUrl = resolveUrl(url);

  let ogImage = DEFAULT_OG_IMAGE;
  let twitterImage = DEFAULT_TWITTER_IMAGE;

  if (image) {
    const resolvedImage = resolveUrl(image);
    ogImage = resolvedImage;
    twitterImage = resolvedImage;
  }

  const robotsContent = noindex ? 'noindex, follow' : 'index, follow';

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={twitterImage} />
      <meta name="twitter:image:alt" content={imageAlt} />
    </>
  );
}
