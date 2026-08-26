import { Sparkles } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { CHANGELOG } from '~/data/changelog';

const LAST_SEEN_KEY = 'onetrick_last_seen_changelog';

export interface ChangelogModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ChangelogModal({
  open: openProp,
  onOpenChange,
  trigger,
}: ChangelogModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const isControlled = openProp !== undefined;
  const isOpen = isControlled ? openProp : internalOpen;

  const latestReleaseId = CHANGELOG[0]?.id;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && latestReleaseId) {
        const lastSeen = window.localStorage.getItem(LAST_SEEN_KEY);
        if (!lastSeen || lastSeen < latestReleaseId) {
          setHasUnread(true);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [latestReleaseId]);

  const handleOpenChange = (openState: boolean) => {
    if (openState && latestReleaseId) {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LAST_SEEN_KEY, latestReleaseId);
        }
      } catch {
        // Ignore storage errors
      }
      setHasUnread(false);
    }

    if (onOpenChange) {
      onOpenChange(openState);
    } else {
      setInternalOpen(openState);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>What's New</span>
            {hasUnread && (
              <span className="absolute right-1 top-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            )}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-4 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b pb-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            What's New in 1 Trick
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Release updates, feature improvements, and recent bug fixes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[65vh] flex-1 flex-col gap-6 divide-y overflow-y-auto pr-2">
          {CHANGELOG.map((release) => {
            const features = release.changes.filter((c) => c.type === 'feature');
            const improvements = release.changes.filter(
              (c) => c.type === 'improvement',
            );
            const fixes = release.changes.filter((c) => c.type === 'fix');

            return (
              <div
                key={release.id}
                className="flex flex-col gap-4 pt-4 first:pt-0"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-bold text-foreground">
                    {release.title}
                  </h3>
                  <span className="text-xs font-semibold text-primary">
                    {release.date}
                  </span>
                </div>

                {release.summary && (
                  <p className="text-xs text-muted-foreground">
                    {release.summary}
                  </p>
                )}

                <div className="flex flex-col gap-4 pt-1">
                  {features.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                        Features
                      </h4>
                      <ul className="flex flex-col gap-1.5 pl-4 list-disc text-xs text-foreground/90">
                        {features.map((item, idx) => (
                          <li key={idx}>{item.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {improvements.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Improvements
                      </h4>
                      <ul className="flex flex-col gap-1.5 pl-4 list-disc text-xs text-foreground/90">
                        {improvements.map((item, idx) => (
                          <li key={idx}>{item.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fixes.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                        Fixes
                      </h4>
                      <ul className="flex flex-col gap-1.5 pl-4 list-disc text-xs text-foreground/90">
                        {fixes.map((item, idx) => (
                          <li key={idx}>{item.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
