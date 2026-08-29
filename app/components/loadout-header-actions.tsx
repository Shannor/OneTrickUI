import { Share2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DeleteSnapshotDialog } from '~/components/delete-snapshot-dialog';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { Logger } from '~/lib/logger';

export interface LoadoutHeaderActionsProps {
  isOwner: boolean;
  snapshotId: string;
  snapshotName?: string;
  characterId?: string;
  userId?: string;
  shareUrl?: string;
}

export function LoadoutHeaderActions({
  isOwner,
  snapshotId,
  snapshotName,
  characterId,
  userId,
  shareUrl,
}: LoadoutHeaderActionsProps) {
  const [copyStatus, setCopyStatus] = useState('');

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus('Copied!');
    } catch (err) {
      setCopyStatus('Failed to copy!');
      Logger.error(err, 'Failed to copy text');
    }
    setTimeout(() => setCopyStatus(''), 2000);
  };

  if (!isOwner && !shareUrl) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
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
