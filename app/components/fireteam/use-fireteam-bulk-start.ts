import { useCallback, useEffect, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import type { FireteamSessionMemberTarget, FireteamSessionResult } from '~/api';
import { toast } from '~/components/ui/sonner';
import {
  type DevFireteamMockScenario,
  type StartFireteamSessionsActionData,
  formatBulkStartSummary,
} from '~/lib/fireteam-sessions';

export function buildBulkStartFormData(
  targets: FireteamSessionMemberTarget[],
  trackComp: boolean,
  devMockScenario?: DevFireteamMockScenario,
): FormData {
  const formData = new FormData();
  formData.append('members', JSON.stringify(targets));
  formData.append('trackComp', String(trackComp));
  if (import.meta.env.DEV && devMockScenario) {
    formData.append('mockScenario', devMockScenario);
  }
  return formData;
}

export interface UseFireteamBulkStartResult {
  isBulkSubmitting: boolean;
  bulkResults?: FireteamSessionResult[];
  visibleResults?: FireteamSessionResult[];
  errorMessage?: string;
  submitBulkStart: (
    targets: FireteamSessionMemberTarget[],
    trackComp: boolean,
  ) => void;
  dismissResults: () => void;
}

export function useFireteamBulkStart(
  devMockScenario?: DevFireteamMockScenario,
): UseFireteamBulkStartResult {
  const bulkFetcher = useFetcher<StartFireteamSessionsActionData>();
  const [dismissedData, setDismissedData] = useState<
    StartFireteamSessionsActionData | undefined
  >(undefined);
  const previousFetcherState = useRef(bulkFetcher.state);

  const isBulkSubmitting = bulkFetcher.state !== 'idle';

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

  const { submit } = bulkFetcher;
  const submitBulkStart = useCallback(
    (targets: FireteamSessionMemberTarget[], trackComp: boolean) => {
      if (targets.length === 0 || isBulkSubmitting) return;
      setDismissedData(undefined);
      const formData = buildBulkStartFormData(
        targets,
        trackComp,
        devMockScenario,
      );
      submit(formData, {
        method: 'post',
        action: '/action/start-fireteam-sessions',
      });
    },
    [devMockScenario, isBulkSubmitting, submit],
  );

  const dismissResults = useCallback(() => {
    setDismissedData(bulkFetcher.data);
  }, [bulkFetcher.data]);

  return {
    isBulkSubmitting,
    bulkResults,
    visibleResults,
    errorMessage,
    submitBulkStart,
    dismissResults,
  };
}
