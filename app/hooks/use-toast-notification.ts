import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { toast } from '~/components/ui/sonner';

const TOAST_MESSAGES: Record<string, string> = {
  session_deleted: 'Session deleted successfully',
  snapshot_deleted: 'Loadout deleted successfully',
  loadout_deleted: 'Loadout deleted successfully',
  session_started: 'Session started successfully',
  session_ended: 'Session ended successfully',
  session_updated: 'Session updated successfully',
  loadout_updated: 'Loadout updated successfully',
};

export function useToastNotification() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const toastParam = searchParams.get('toast');
    if (!toastParam) return;

    const message = TOAST_MESSAGES[toastParam] ?? toastParam;
    toast.success(message);

    // Remove toast query param from URL while keeping other search params
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('toast');

    const searchString = newParams.toString();
    const newUrl = searchString
      ? `${location.pathname}?${searchString}`
      : location.pathname;

    navigate(newUrl, { replace: true });
  }, [searchParams, location.pathname, navigate]);
}
