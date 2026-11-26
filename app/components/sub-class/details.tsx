import { Empty } from '~/components/empty';
import { useSubClass } from '~/providers/sub-class-provider';

import { Abilities } from './abilities';
import { Aspects } from './aspects';
import { Fragments } from './fragments';
import { Super } from './super';

export function SubClassDetails() {
  const { hasSockets } = useSubClass();

  if (!hasSockets) {
    return <Empty title="No Sockets Found" />;
  }

  return (
    <div className="flex shrink-0 flex-col gap-4">
      <Super />
      <Abilities />
      <Aspects />
      <Fragments />
    </div>
  );
}
