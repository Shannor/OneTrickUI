import type { Route } from './+types/TrackerPage';

export async function loader({ params }: Route.LoaderArgs) {
  const res = await fetch(
    `http://localhost:8080/activities/15793846459/weapons`,
  );
  const json = await res.json();
  return json;
}
export default function TrackerPage({ loaderData }: Route.ComponentProps) {
  console.log(loaderData);
  return <div>Tracker</div>;
}
