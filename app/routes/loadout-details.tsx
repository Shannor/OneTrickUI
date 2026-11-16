import { ClassStatsRadar } from '~/charts/ClassStatsRadar';
import { ArmorSet } from '~/components/armor-set';
import { Empty } from '~/components/empty';
import { Abilities, Aspects, Fragments, Super } from '~/components/sub-class';
import { Weapon } from '~/components/weapon';
import { getDetailWeapons, useClassStats } from '~/hooks/use-loadout';
import {
  useLoadoutData,
  useOptionalProfileData,
} from '~/hooks/use-route-loaders';
import { SubClassProvider } from '~/providers/sub-class-provider';

export function LoadoutDetails() {
  const { snapshot, error, path } = useLoadoutData();
  const { profile } = useOptionalProfileData() ?? {};
  const values = useClassStats(snapshot);
  const data = getDetailWeapons(snapshot?.loadout);

  const loadoutName = snapshot?.name || 'Loadout';
  const displayName = profile?.displayName;
  const pageTitle = displayName
    ? `${loadoutName} - ${displayName} | 1 Trick`
    : `${loadoutName} | 1 Trick`;
  const pageDescription =
    snapshot?.description ||
    `View armor stats, subclass, and weapon details for ${displayName ? `${displayName}'s ` : ''}${loadoutName} on 1 Trick.`;

  const origin = path ? new URL(path).origin : 'https://d2onetrick.com';
  const ogImageUrl = snapshot?.id
    ? `${origin}/og/loadout/${snapshot.id}.png`
    : `${origin}/og-image.png`;

  const metaTags = (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      {path && <meta property="og:url" content={path} />}
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImageUrl} />
      {path && <link rel="canonical" href={path} />}
    </>
  );

  if (!snapshot || error) {
    return (
      <>
        {metaTags}
        <Empty
          title="No Loadout Details Found"
          description="Unable to load gear and subclass details for this loadout."
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-20">
      {metaTags}
      <div className="flex flex-col gap-10 lg:flex-row">
        <SubClassProvider snapshot={snapshot}>
          <div className="flex flex-col gap-4">
            <Super />
            <Abilities />
            <Aspects />
            <Fragments />
          </div>
        </SubClassProvider>
        <ClassStatsRadar data={values} />
      </div>
      <div className="col-span-12 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-3 xl:gap-12">
          {data.map((item) => (
            <Weapon
              key={item.itemHash}
              referenceId={item.itemHash}
              properties={item.details}
              stats={item.stats}
            />
          ))}
        </div>
      </div>
      <div className="flex w-full flex-col">
        <ArmorSet snapshot={snapshot} />
      </div>
    </div>
  );
}

export default LoadoutDetails;
