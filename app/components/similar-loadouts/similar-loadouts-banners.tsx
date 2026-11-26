import { GlobeIcon, InfoIcon, LayersIcon, Loader2 } from 'lucide-react';

export function SimilarLoadoutsScopeNotice() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
      <GlobeIcon className="h-4 w-4 shrink-0 text-primary" />
      <span>
        Global Scope: Merging combines match history across all PvP modes and
        sessions into the primary loadout.
      </span>
    </div>
  );
}

export function SimilarLoadoutsPageHeader() {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="flex items-center gap-2 text-2xl font-bold leading-none tracking-wide sm:text-3xl">
        <LayersIcon className="h-5 w-5 text-primary" />
        <span>Compare & Merge Similar Loadouts</span>
      </h2>
      <SimilarLoadoutsScopeNotice />
    </div>
  );
}

export function SimilarLoadoutsMergeBanner({
  statusText,
}: {
  statusText: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="merge-progress-banner"
      className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-foreground"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
      <div className="flex flex-col">
        <span className="font-semibold">{statusText}</span>
        <span className="text-xs text-muted-foreground">
          Please stay on this page until the merge completes.
        </span>
      </div>
    </div>
  );
}

export function SimilarLoadoutsLegend() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-md border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-muted-foreground sm:text-sm">
      <div className="flex items-center gap-1.5 font-semibold text-foreground">
        <InfoIcon className="h-4 w-4 shrink-0 text-primary" />
        <span>Tap or hover any badge to inspect item rolls & stats:</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
          Different Exotic / Roll
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
          Different Set Bonus
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
          Different Power Weapon
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
          +Stat vs Primary
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
          -Stat vs Primary
        </span>
      </div>
    </div>
  );
}
