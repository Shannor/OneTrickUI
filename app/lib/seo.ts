export interface BuildMetaOptions {
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
const BASE_URL = 'https://d2onetrick.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.svg`;
const DEFAULT_TWITTER_IMAGE = `${BASE_URL}/twitter-image.svg`;
const DEFAULT_IMAGE_ALT = 'One Trick - Destiny 2 PvP Tracker';

export function resolveUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) {
    return BASE_URL;
  }
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${BASE_URL}${cleanPath}`;
}

export function buildMeta(options: BuildMetaOptions = {}) {
  const title = options.title ? options.title : DEFAULT_TITLE;
  const description = options.description
    ? options.description
    : DEFAULT_DESCRIPTION;
  const keywords = options.keywords ? options.keywords : DEFAULT_KEYWORDS;
  const url = resolveUrl(options.url);

  let ogImage = DEFAULT_OG_IMAGE;
  let twitterImage = DEFAULT_TWITTER_IMAGE;

  if (options.image) {
    const resolvedImage = resolveUrl(options.image);
    ogImage = resolvedImage;
    twitterImage = resolvedImage;
  }

  const imageAlt = options.imageAlt || DEFAULT_IMAGE_ALT;
  const type = options.type || 'website';
  const robotsContent = options.noindex ? 'noindex, follow' : 'index, follow';

  return [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { tagName: 'link', rel: 'canonical', href: url },
    { name: 'robots', content: robotsContent },
    // Open Graph
    { property: 'og:site_name', content: DEFAULT_SITE_NAME },
    { property: 'og:type', content: type },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: imageAlt },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: twitterImage },
    { name: 'twitter:image:alt', content: imageAlt },
  ];
}

export function getProfileFromMatches(
  matches?: Array<{ id?: string; data?: unknown } | undefined>,
) {
  if (!matches) {
    return undefined;
  }
  const profileMatch = matches.find((m) => m?.id === 'routes/profile-state');
  const data = profileMatch?.data as { profile?: unknown } | undefined;
  return data?.profile;
}
