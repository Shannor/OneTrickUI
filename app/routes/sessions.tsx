import type { Route } from './+types/sessions';
import { createSnapshot } from '~/api';
import { useSubmit } from 'react-router';
import { Button } from '~/components/ui/button';

export async function clientAction({ request }: Route.ClientActionArgs) {
  const { data, error } = await createSnapshot();
  if (error) {
    return error;
  }
  if (!data) {
    return { message: 'No data' };
  }
  return data;
}

export default function Sessions({ actionData }: Route.ComponentProps) {
  let submit = useSubmit();

  return (
    <div>
      Sessions
      <Button
        onClick={() =>
          submit(null, { method: 'post', encType: 'application/json' })
        }
      >
        Create New Snapshot
      </Button>
    </div>
  );
}
