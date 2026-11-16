import { GlobeIcon, LayersIcon } from 'lucide-react';
import { useState } from 'react';
import {
  type CombinedStatsResult,
  calculateCombinedStats,
} from '~/calculations/precision';
import {
  SimilarLoadoutCandidateCard,
  type SimilarLoadoutCandidateCardProps,
  SimilarLoadoutCandidateDiffBadges,
  type SimilarLoadoutCandidateDiffBadgesProps,
  SimilarLoadoutCandidateGroup,
  type SimilarLoadoutCandidateGroupProps,
  SimilarLoadoutsLegend,
  SimilarLoadoutsLoadingState,
  SimilarLoadoutsMergeBanner,
  SimilarLoadoutsPageHeader,
  SimilarLoadoutsPrimaryHeader,
  type SimilarLoadoutsPrimaryHeaderProps,
  SimilarLoadoutsScopeNotice,
  SimilarLoadoutsView,
  type SimilarLoadoutsViewProps,
  buildSimilarSnapshotItem,
  computeCandidateStatDiffs,
  computeStatDiffMap,
  doesExoticArmorMatch,
  doesPowerWeaponMatch,
  extractClassStatMap,
  recomputeSimilarItems,
} from '~/components/similar-loadouts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { TooltipProvider } from '~/components/ui/tooltip';

export {
  buildSimilarSnapshotItem,
  calculateCombinedStats,
  type CombinedStatsResult,
  computeCandidateStatDiffs,
  computeStatDiffMap,
  doesExoticArmorMatch,
  doesPowerWeaponMatch,
  extractClassStatMap,
  recomputeSimilarItems,
  SimilarLoadoutCandidateCard,
  type SimilarLoadoutCandidateCardProps,
  SimilarLoadoutCandidateDiffBadges,
  type SimilarLoadoutCandidateDiffBadgesProps,
  SimilarLoadoutCandidateGroup,
  type SimilarLoadoutCandidateGroupProps,
  SimilarLoadoutsLegend,
  SimilarLoadoutsLoadingState,
  SimilarLoadoutsMergeBanner,
  SimilarLoadoutsPageHeader,
  SimilarLoadoutsPrimaryHeader,
  type SimilarLoadoutsPrimaryHeaderProps,
  SimilarLoadoutsScopeNotice,
  SimilarLoadoutsView,
  type SimilarLoadoutsViewProps,
};

export interface SimilarLoadoutsDialogProps {
  snapshotId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  characterId?: string;
  /**
   * Set to true when opened from /profile/:id/c/:characterId/loadouts/:snapshotId
   * so that if the user swaps primary and merges, we navigate to the new primary snapshot route.
   */
  isDetailPage?: boolean;
}

export function SimilarLoadoutsDialog({
  snapshotId,
  isOpen,
  onOpenChange,
  userId,
  characterId,
  isDetailPage = false,
}: SimilarLoadoutsDialogProps) {
  const [isMerging, setIsMerging] = useState(false);

  return (
    <TooltipProvider delayDuration={150}>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (isMerging) return;
          onOpenChange(open);
        }}
      >
        <DialogContent
          className="max-h-[90vh] max-w-3xl overflow-y-auto"
          onEscapeKeyDown={(e) => {
            if (isMerging) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (isMerging) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <LayersIcon className="h-5 w-5 text-primary" />
              <span>Compare & Merge Similar Loadouts</span>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 text-xs sm:text-sm">
              <GlobeIcon className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Global Scope: Merging combines match history across all PvP
                modes and sessions into the primary loadout.
              </span>
            </DialogDescription>
          </DialogHeader>

          <SimilarLoadoutsView
            snapshotId={snapshotId}
            isActive={isOpen}
            onClose={() => onOpenChange(false)}
            onMergingChange={setIsMerging}
            userId={userId}
            characterId={characterId}
            isDetailPage={isDetailPage}
          />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
