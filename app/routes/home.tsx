import { Form, useOutletContext } from 'react-router';
import { CharacterPicker } from '~/components/character-picker';
import { LoadingButton } from '~/components/loading-button';
import { useIsNavigating } from '~/lib/hooks';
import type { OutletContext } from '~/types/context';

import type { Route } from './+types/home';

export default function Home() {
  const [isNavigating] = useIsNavigating();
  return (
    <div className="flex flex-col gap-4">
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Welcome
      </h2>
    </div>
  );
}
