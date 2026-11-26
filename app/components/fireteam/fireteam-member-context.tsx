import { type ReactNode, createContext, useContext } from 'react';
import type { FireteamMemberView } from '~/lib/fireteam-sessions';

const FireteamMemberContext = createContext<FireteamMemberView | null>(null);

export function useFireteamMember(): FireteamMemberView {
  const context = useContext(FireteamMemberContext);
  if (!context) {
    throw new Error(
      'useFireteamMember must be used within a FireteamMemberProvider',
    );
  }
  return context;
}

export interface FireteamMemberProviderProps {
  view: FireteamMemberView;
  children: ReactNode;
}

export function FireteamMemberProvider({
  view,
  children,
}: FireteamMemberProviderProps) {
  return (
    <FireteamMemberContext.Provider value={view}>
      {children}
    </FireteamMemberContext.Provider>
  );
}
