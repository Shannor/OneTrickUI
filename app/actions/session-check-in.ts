import { sessionCheckIn } from '~/api';

import type { Route } from '../../.react-router/types/app/+types/root';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const membershipId = formData.get('membershipId');
  const sessionId = formData.get('sessionId');

  if (!membershipId) {
    return { error: 'No membership id' };
  }

  if (!sessionId) {
    return { error: 'No session id' };
  }
  const response = await sessionCheckIn({
    body: {
      sessionId: sessionId.toString(),
    },
    headers: {
      'X-Membership-ID': membershipId.toString(),
    },
  });
  if (response.error) {
    return { error: response.error };
  }
  return response.data;
}
