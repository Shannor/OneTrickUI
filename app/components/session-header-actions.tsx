import { log } from 'evlog';
import { Share2, StopCircleIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFetcher } from 'react-router';
import { DeleteSessionDialog } from '~/components/delete-session-dialog';
import { LoadingButton } from '~/components/loading-button';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';

export interface SessionHeaderActionsProps {
  isOwner: boolean;
  isCurrent: boolean;
  sessionId: string;
  sessionName?: string;
  characterId?: string;
  userId?: string;
  shareUrl: string;
}

export function SessionHeaderActions({
  isOwner,
  isCurrent,
  sessionId,
  sessionName,
  characterId,
  userId,
  shareUrl,
}: SessionHeaderActionsProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === 'submitting';
  const [copyStatus, setCopyStatus] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus('Copied!');
    } catch (err) {
      setCopyStatus('Failed to copy!');
      log.error({
        action: 'session.copy_share_url',
        message: 'Failed to copy session share URL',
        error: err instanceof Error ? err.message : String(err),
      });
    }
    setTimeout(() => setCopyStatus(''), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isOwner && isCurrent && (
        <fetcher.Form method="post" action="/action/end-session">
          <input type="hidden" name="characterId" value={characterId} />
          <input type="hidden" name="sessionId" value={sessionId} />
          <LoadingButton
            type="submit"
            variant="outline"
            size="sm"
            disabled={!characterId || isSubmitting}
            isLoading={isSubmitting}
          >
            <StopCircleIcon className="h-4 w-4" />
            <span>Stop Session</span>
          </LoadingButton>
        </fetcher.Form>
      )}

      <Tooltip disableTapTrigger open={copyStatus ? true : undefined}>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex min-h-11 items-center gap-2 sm:min-h-9"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copyStatus || 'Share Session'}</TooltipContent>
      </Tooltip>

      {isOwner && (
        <Tooltip disableTapTrigger>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <DeleteSessionDialog
                sessionId={sessionId}
                sessionName={sessionName}
                characterId={characterId}
                userId={userId}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-9 sm:w-9"
                    aria-label="Delete Session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete Session</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
