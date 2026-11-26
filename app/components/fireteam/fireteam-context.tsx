import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type {
  FireteamMember,
  FireteamSessionMemberTarget,
  FireteamSessionResult,
} from '~/api';
import { useIsNavigating } from '~/hooks/use-route-loaders';
import {
  type DevFireteamMockScenario,
  type FireteamMemberView,
  buildFireteamViewModel,
} from '~/lib/fireteam-sessions';

import { useFireteamBulkStart } from './use-fireteam-bulk-start';
import { useFireteamSelection } from './use-fireteam-selection';

export interface FireteamContextValue {
  memberViews: FireteamMemberView[];
  memberNames: Record<string, string>;
  selectedTargets: FireteamSessionMemberTarget[];
  readyCount: number;
  activeHeaderCount: number;
  activeSelectedCount: number;
  trackComp: boolean;
  setTrackComp: (trackComp: boolean) => void;
  isBulkSubmitting: boolean;
  isSubmitting: boolean;
  visibleResults?: FireteamSessionResult[];
  errorMessage?: string;
  submitBulkStart: () => void;
  dismissResults: () => void;
  toggleMemberBulkSelect: (memberKey: string, selected: boolean) => void;
  selectMemberCharacter: (
    memberKey: string,
    nextCharId?: string | null,
  ) => void;
}

export const FireteamContext = createContext<FireteamContextValue | null>(null);

export function useFireteam(): FireteamContextValue {
  const context = useContext(FireteamContext);
  if (!context) {
    throw new Error('useFireteam must be used within a FireteamProvider');
  }
  return context;
}

export interface FireteamProviderProps {
  members: FireteamMember[];
  fireteamMemWithCharacters: Record<string, string>;
  devMockScenario?: DevFireteamMockScenario;
  children: ReactNode;
}

export function FireteamProvider({
  members,
  fireteamMemWithCharacters,
  devMockScenario,
  children,
}: FireteamProviderProps) {
  const [isNavigating] = useIsNavigating();
  const [trackComp, setTrackComp] = useState(false);

  const {
    isBulkSubmitting,
    bulkResults,
    visibleResults,
    errorMessage,
    submitBulkStart: submitBulkStartRequest,
    dismissResults,
  } = useFireteamBulkStart(devMockScenario);

  const {
    draftCharacters,
    excludedMemberIds,
    toggleMemberBulkSelect,
    selectMemberCharacter,
  } = useFireteamSelection(fireteamMemWithCharacters);

  const viewModel = useMemo(
    () =>
      buildFireteamViewModel({
        members,
        fireteamMemWithCharacters,
        draftCharacters,
        excludedMemberIds,
        bulkResults,
        visibleResults,
      }),
    [
      members,
      fireteamMemWithCharacters,
      draftCharacters,
      excludedMemberIds,
      bulkResults,
      visibleResults,
    ],
  );

  const submitBulkStart = useCallback(() => {
    submitBulkStartRequest(viewModel.selectedTargets, trackComp);
  }, [submitBulkStartRequest, viewModel.selectedTargets, trackComp]);

  const isSubmitting = isNavigating || isBulkSubmitting;

  const value = useMemo<FireteamContextValue>(
    () => ({
      ...viewModel,
      trackComp,
      setTrackComp,
      isBulkSubmitting,
      isSubmitting,
      visibleResults,
      errorMessage,
      submitBulkStart,
      dismissResults,
      toggleMemberBulkSelect,
      selectMemberCharacter,
    }),
    [
      viewModel,
      trackComp,
      isBulkSubmitting,
      isSubmitting,
      visibleResults,
      errorMessage,
      submitBulkStart,
      dismissResults,
      toggleMemberBulkSelect,
      selectMemberCharacter,
    ],
  );

  return (
    <FireteamContext.Provider value={value}>
      {children}
    </FireteamContext.Provider>
  );
}
