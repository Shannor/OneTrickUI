import { ClassStatsRadar } from '~/charts/ClassStatsRadar';
import { ArmorSet } from '~/components/armor-set';
import { Empty } from '~/components/empty';
import { Abilities, Aspects, Fragments, Super } from '~/components/sub-class';
import { Weapon } from '~/components/weapon';
import { getDetailWeapons, useClassStats } from '~/hooks/use-loadout';
import { useLoadoutData } from '~/hooks/use-route-loaders';
import { SubClassProvider } from '~/providers/sub-class-provider';

export function LoadoutDetails() {
  const { snapshot, error } = useLoadoutData();
  const values = useClassStats(snapshot);
  const data = getDetailWeapons(snapshot?.loadout);

  if (!snapshot || error) {
    return (
      <Empty
        title="No Loadout Details Found"
        description="Unable to load gear and subclass details for this loadout."
      />
    );
  }

  return (
    <div className="flex flex-col gap-20">
      <title>{`${snapshot.name ?? 'Loadout'} - Details`}</title>
      <meta
        property="og:title"
        content={`${snapshot.name ?? 'Loadout'} - Details`}
      />
      <meta
        name="description"
        content={`View armor stats and gear details for ${snapshot.name ?? 'this loadout'}.`}
      />
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
