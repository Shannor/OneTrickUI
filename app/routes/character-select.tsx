import { Link } from 'react-router';
import { CharacterPicker } from '~/components/character-picker';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { useIsNavigating, useProfileData } from '~/hooks/use-route-loaders';
import { getSiteOrigin } from '~/lib/utils';

export function CharacterSelect() {
  const data = useProfileData();
  const [isNavigating] = useIsNavigating();
  const origin = getSiteOrigin();

  if (!data) {
    return (
      <div>
        <title>Choose a Character | 1 Trick</title>
        <meta
          name="description"
          content="Select the Destiny 2 character to view sessions, snapshots, and metrics on 1 Trick."
        />
        Loading...
      </div>
    );
  }
  if (data.type === 'error') {
    return (
      <>
        <title>Choose a Character | 1 Trick</title>
        <meta
          name="description"
          content="Select the Destiny 2 character to view sessions, snapshots, and metrics on 1 Trick."
        />
        <Empty
          title="Failed to load characters"
          description="Didn't find any characters for this account."
        />
      </>
    );
  }

  const { profile, type } = data;
  const characters = profile.characters;
  const pageTitle = profile.displayName
    ? `Choose a Character - ${profile.displayName} | 1 Trick`
    : 'Choose a Character | 1 Trick';
  const pageDescription =
    'Select the Destiny 2 character to view sessions, snapshots, and metrics on 1 Trick.';
  const canonicalUrl = profile.id
    ? `https://d2onetrick.com/profile/${profile.id}`
    : '';

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
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
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <h2 className="w-full scroll-m-20 break-words border-b pb-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {type === 'viewer'
            ? `Which character do you want to view for ${profile.displayName}?`
            : `Welcome, ${profile.displayName}`}
        </h2>
        <CharacterPicker characters={characters}>
          {(current) => {
            const isDisabled = !current;
            return (
              <LoadingButton
                asChild={!isDisabled}
                disabled={isDisabled}
                isLoading={isNavigating}
              >
                {isDisabled ? (
                  'Pick Guardian'
                ) : (
                  <Link to={`c/${current}`}>Pick Guardian</Link>
                )}
              </LoadingButton>
            );
          }}
        </CharacterPicker>
      </div>
    </div>
  );
}

export default CharacterSelect;
