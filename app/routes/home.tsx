import { Link, useOutletContext, useSubmit } from 'react-router';
import { CharacterPicker } from '~/components/character-picker';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import type { OutletContext } from '~/types/context';

import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'One Trick - Home' },
    { name: 'description', content: 'Welcome to One Trick!' },
  ];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <div>Oops, something went wrong!</div>;
}
export default function Home() {
  const { profile, characterId } = useOutletContext<OutletContext>();
  const submit = useSubmit();
  return (
    <div className="flex flex-col gap-4">
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Welcome, {profile?.displayName}!
      </h2>
      <div className="grid place-items-center">
        <CharacterPicker
          onSubmit={(characterId) => {
            const data = new FormData();
            data.set('characterId', characterId);
            data.set('redirect', '/');
            submit(data, {
              method: 'post',
              action: '/action/set-preference',
            }).catch(console.error);
          }}
          characters={profile.characters}
          currentCharacterId={characterId}
        />
      </div>
    </div>
  );
}
