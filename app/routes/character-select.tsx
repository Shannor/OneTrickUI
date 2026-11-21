import { LogIn, Search } from 'lucide-react';
import { Link } from 'react-router';
import { CharacterPicker } from '~/components/character-picker';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { ShareSiteButton } from '~/components/share-site-button';
import { Button } from '~/components/ui/button';
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
    const errorTitle = 'Guardian Not Recorded | 1 Trick';
    const errorDescription =
      '1 Trick only supports profiles for Guardians who have recorded their data in our system.';

    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center py-8">
        <title>{errorTitle}</title>
        <meta name="description" content={errorDescription} />
        <meta property="og:title" content={errorTitle} />
        <meta property="og:description" content={errorDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${origin}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={errorTitle} />
        <meta name="twitter:description" content={errorDescription} />
        <meta name="twitter:image" content={`${origin}/twitter-image.png`} />
        <Empty
          className="w-full max-w-xl"
          title="Guardian Not Recorded"
          description="This profile was not found. 1 Trick only supports Guardians who have recorded their data in our system."
        >
          <div className="mt-2 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link to="/login">
                <LogIn className="h-4 w-4" />
                <span>Start Recording</span>
              </Link>
            </Button>
            <ShareSiteButton
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Link to="/search">
                <Search className="h-4 w-4" />
                <span>Search Guardians</span>
              </Link>
            </Button>
          </div>
        </Empty>
      </div>
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
