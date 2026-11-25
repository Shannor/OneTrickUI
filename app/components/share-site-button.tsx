import { log } from 'evlog';
import { Check, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button, type ButtonProps } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn, getSiteOrigin } from '~/lib/utils';

export interface ShareSiteButtonProps {
  shareUrl?: string;
  playerName?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
  label?: string;
}

export function ShareSiteButton({
  shareUrl,
  playerName,
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Share 1 Trick',
}: ShareSiteButtonProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const scheduleStatusReset = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => setCopyStatus(''), 2000);
  };

  const handleShare = async () => {
    const resolvedUrl = shareUrl || getSiteOrigin();
    const shareText = playerName
      ? `Invite ${playerName} to start recording Destiny 2 PvP sessions and loadouts on 1 Trick.`
      : 'Track Destiny 2 PvP sessions, loadouts, and Crucible stats on 1 Trick.';

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({
          title: '1 Trick',
          text: shareText,
          url: resolvedUrl,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopyStatus('Copied!');
    } catch (err) {
      setCopyStatus('Failed to copy!');
      log.error({
        action: 'search.share_site',
        message: 'Failed to copy 1 Trick share URL',
        error: err instanceof Error ? err.message : String(err),
      });
    }
    scheduleStatusReset();
  };

  const isCopied = copyStatus === 'Copied!';

  return (
    <TooltipProvider>
      <Tooltip disableTapTrigger open={copyStatus ? true : undefined}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={handleShare}
            variant={variant}
            size={size}
            className={cn('inline-flex items-center gap-2', className)}
          >
            {isCopied ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <Share2 className="h-4 w-4 shrink-0" />
            )}
            <span>{isCopied ? 'Copied!' : label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {copyStatus || 'Copy 1 Trick link to invite a Guardian'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
