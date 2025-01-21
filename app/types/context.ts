import type { Profile } from '~/api';

export interface OutletContext {
  characterId?: string;
  profile: Profile;
}
