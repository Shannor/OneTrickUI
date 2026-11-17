import { log } from 'evlog';
import { Copy, Share2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Loadout } from '~/api';
import { DeleteSnapshotDialog } from '~/components/delete-snapshot-dialog';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { buildDimSearchQuery } from '~/hooks/use-loadout';

export interface LoadoutHeaderActionsProps {
  isOwner: boolean;
  snapshotId: string;
  snapshotName?: string;
  characterId?: string;
  userId?: string;
  shareUrl?: string;
  loadout?: Loadout;
}

export function LoadoutHeaderActions({
  isOwner,
  snapshotId,
  snapshotName,
  characterId,
  userId,
  shareUrl,
  loadout,
}: LoadoutHeaderActionsProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const [dimCopyStatus, setDimCopyStatus] = useState('');
  const dimQuery = buildDimSearchQuery(loadout);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus('Copied!');
    } catch (err) {
      setCopyStatus('Failed to copy!');
      log.error({
        action: 'loadout.copy_share_url',
        message: 'Failed to copy loadout share URL',
        error: err instanceof Error ? err.message : String(err),
      });
    }
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const handleCopyDimQuery = async () => {
    if (!dimQuery) return;
    try {
      await navigator.clipboard.writeText(dimQuery);
      setDimCopyStatus('Copied DIM Query!');
    } catch (err) {
      setDimCopyStatus('Failed to copy!');
      log.error({
        action: 'loadout.copy_dim_query',
        message: 'Failed to copy loadout DIM query',
        error: err instanceof Error ? err.message : String(err),
      });
    }
    setTimeout(() => setDimCopyStatus(''), 2000);
  };

  if (!isOwner && !shareUrl) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isOwner && dimQuery && (
        <Tooltip open={dimCopyStatus ? true : undefined}>
          <TooltipTrigger asChild>
            <Button
              onClick={handleCopyDimQuery}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              <span>Copy DIM Query</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {dimCopyStatus || 'Paste in the search bar in DIM'}
          </TooltipContent>
        </Tooltip>
      )}

      {shareUrl && (
        <Tooltip open={copyStatus ? true : undefined}>
          <TooltipTrigger asChild>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copyStatus || 'Share Loadout'}</TooltipContent>
        </Tooltip>
      )}

      {isOwner && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <DeleteSnapshotDialog
                snapshotId={snapshotId}
                snapshotName={snapshotName}
                characterId={characterId}
                userId={userId}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete Loadout"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete Loadout</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}


