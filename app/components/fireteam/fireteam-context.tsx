import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useFetcher } from 'react-router';
import type { DevFireteamMockScenario } from '~/.server/dev-fireteam-mock';
import type {
  FireteamMember,
  FireteamSessionMemberTarget,
  FireteamSessionResult,
} from '~/api';
import { toast } from '~/components/ui/sonner';
import { useIsNavigating } from '~/hooks/use-route-loaders';
import {
  type FireteamMemberView,
  type StartFireteamSessionsActionData,
  buildFireteamViewModel,
  formatBulkStartSummary,
} from '~/lib/fireteam-sessions';

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
    savedCharId: string | undefined,
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
  const bulkFetcher = useFetcher<StartFireteamSessionsActionData>();

  const [trackComp, setTrackComp] = useState(false);
  const [draftCharacters, setDraftCharacters] = useState<
    Record<string, string>
  >({});
  const [excludedMemberIds, setExcludedMemberIds] = useState<
    Record<string, boolean>
  >({});
  const [dismissedData, setDismissedData] = useState<
    StartFireteamSessionsActionData | undefined
  >(undefined);
  const previousFetcherState = useRef(bulkFetcher.state);

  const isBulkSubmitting = bulkFetcher.state !== 'idle';
  const isSubmitting = isNavigating || isBulkSubmitting;

  useEffect(() => {
    if (
      previousFetcherState.current !== 'idle' &&
      bulkFetcher.state === 'idle' &&
      bulkFetcher.data
    ) {
      if (bulkFetcher.data.ok) {
        const summary = formatBulkStartSummary(bulkFetcher.data.results);
        toast.success(summary.title);
      } else {
        toast.error(bulkFetcher.data.error);
      }
    }
    previousFetcherState.current = bulkFetcher.state;
  }, [bulkFetcher.state, bulkFetcher.data]);

  const bulkResults = bulkFetcher.data?.ok
    ? bulkFetcher.data.results
    : undefined;
  const visibleResults =
    bulkResults && dismissedData !== bulkFetcher.data ? bulkResults : undefined;
  const errorMessage =
    bulkFetcher.state === 'idle' && bulkFetcher.data?.ok === false
      ? bulkFetcher.data.error
      : undefined;

  const viewModel = buildFireteamViewModel({
    members,
    fireteamMemWithCharacters,
    draftCharacters,
    excludedMemberIds,
    bulkResults,
    visibleResults,
  });

  const submitBulkStart = () => {
    if (viewModel.selectedTargets.length === 0 || isBulkSubmitting) return;
    setDismissedData(undefined);
    const formData = new FormData();
    formData.append('members', JSON.stringify(viewModel.selectedTargets));
    formData.append('trackComp', String(trackComp));
    if (import.meta.env.DEV && devMockScenario) {
      formData.append('mockScenario', devMockScenario);
    }
    bulkFetcher.submit(formData, {
      method: 'post',
      action: '/action/start-fireteam-sessions',
    });
  };

  const dismissResults = () => {
    setDismissedData(bulkFetcher.data);
  };

  const toggleMemberBulkSelect = (memberKey: string, selected: boolean) => {
    setExcludedMemberIds((prev) => ({
      ...prev,
      [memberKey]: !selected,
    }));
  };

  const selectMemberCharacter = (
    memberKey: string,
    savedCharId: string | undefined,
    nextCharId?: string | null,
  ) => {
    setDraftCharacters((prev) => {
      if (!nextCharId || nextCharId === savedCharId) {
        const next = { ...prev };
        delete next[memberKey];
        return next;
      }
      return {
        ...prev,
        [memberKey]: nextCharId,
      };
    });
  };

  return (
    <FireteamContext.Provider
      value={{
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
      }}
    >
      {children}
    </FireteamContext.Provider>
  );
}

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
