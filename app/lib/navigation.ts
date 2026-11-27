import type { NavigateFunction } from 'react-router';

export interface BackNavigationParams {
  id?: string;
  characterId?: string;
  sessionId?: string;
}

export function handleBackNavigation(
  navigate: NavigateFunction,
  pathname: string,
  params: BackNavigationParams = {},
): void {
  const historyIdx = window?.history?.state?.idx;
  const hasHistory = Number.isInteger(historyIdx) && historyIdx > 0;

  if (hasHistory) {
    navigate(-1);
    return;
  }

  const { id, characterId, sessionId } = params;
  if (id && characterId) {
    const charBaseUrl = `/profile/${id}/c/${characterId}`;
    const cleanPath = pathname.replace(/\/$/, '') || '/';
    if (sessionId) {
      const sessionBaseUrl = `${charBaseUrl}/sessions/${sessionId}`;
      if (cleanPath.startsWith(`${sessionBaseUrl}/activities/`)) {
        navigate(sessionBaseUrl);
        return;
      }
    }
    if (cleanPath === charBaseUrl) {
      navigate('/');
    } else {
      navigate(charBaseUrl);
    }
    return;
  }

  navigate('/');
}
