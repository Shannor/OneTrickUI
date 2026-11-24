import { GitBranch, X } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { cn } from '~/lib/utils';

const ACCENT_DOT_CLASSES = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-cyan-500',
] as const;

const badgeListeners = new Set<() => void>();

function subscribeBadge(callback: () => void) {
  badgeListeners.add(callback);
  return () => {
    badgeListeners.delete(callback);
  };
}

export function getBranchAccentClass(branch: string): string {
  let hash = 0;
  for (let i = 0; i < branch.length; i++) {
    hash = (hash * 31 + branch.charCodeAt(i)) >>> 0;
  }
  return ACCENT_DOT_CLASSES[hash % ACCENT_DOT_CLASSES.length];
}

function getDismissStorageKey(branch: string, port: string): string {
  return `onetrick_dev_worktree_badge_dismissed:${branch}:${port}`;
}

export interface DevWorktreeBadgeProps {
  branch?: string | null;
  port?: string | null;
  className?: string;
}

export function DevWorktreeBadge({
  branch,
  port,
  className,
}: DevWorktreeBadgeProps) {
  const resolvedBranch =
    branch !== undefined
      ? branch?.trim() || ''
      : (import.meta.env.VITE_DEV_GIT_BRANCH as string | undefined)?.trim() ||
        '';

  const [dismissedKeys, setDismissedKeys] = useState<string[]>([]);

  const clientPort = useSyncExternalStore(
    subscribeBadge,
    () => window.location.port || '',
    () => '',
  );
  const resolvedPort = port !== undefined ? (port ?? '') : clientPort;
  const storageKey = resolvedBranch
    ? getDismissStorageKey(resolvedBranch, resolvedPort)
    : null;

  const isVisibleInStorage = useSyncExternalStore(
    subscribeBadge,
    () => {
      if (!storageKey) return false;
      try {
        return sessionStorage.getItem(storageKey) !== '1';
      } catch {
        return true;
      }
    },
    () => false,
  );

  if (
    !resolvedBranch ||
    !storageKey ||
    !isVisibleInStorage ||
    dismissedKeys.includes(storageKey)
  ) {
    return null;
  }

  const handleDismiss = () => {
    setDismissedKeys((prev) =>
      prev.includes(storageKey) ? prev : [...prev, storageKey],
    );
    try {
      sessionStorage.setItem(storageKey, '1');
      badgeListeners.forEach((listener) => listener());
    } catch {
      // Ignore storage access errors in restricted browsing modes
    }
  };

  const fullLabel = resolvedPort
    ? `${resolvedBranch} (port ${resolvedPort})`
    : resolvedBranch;

  return (
    <div
      role="status"
      aria-label={`Active branch ${fullLabel}`}
      title={fullLabel}
      className={cn(
        'fixed bottom-3 right-14 z-40 flex max-w-[calc(100vw-4.5rem)] items-center gap-1.5 rounded-full border border-border/80 bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-md backdrop-blur-sm sm:max-w-xs',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-2 w-2 shrink-0 rounded-full',
          getBranchAccentClass(resolvedBranch),
        )}
      />
      <GitBranch
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
      />
      <span className="truncate font-mono">{resolvedBranch}</span>
      {resolvedPort ? (
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          :{resolvedPort}
        </span>
      ) : null}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss branch indicator"
        className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
