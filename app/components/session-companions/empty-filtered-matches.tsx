import type { SessionCompanion } from '~/api';
import { Empty } from '~/components/empty';
import { Button } from '~/components/ui/button';
import { formatSelectedCompanionNames } from '~/lib/session-companions';
import { cn } from '~/lib/utils';

export interface EmptyFilteredMatchesProps {
  selectedCompanions: SessionCompanion[];
  onClearFilters: () => void;
  context: 'games' | 'metrics';
  className?: string;
}

export function EmptyFilteredMatches({
  selectedCompanions,
  onClearFilters,
  context,
  className,
}: EmptyFilteredMatchesProps) {
  const selectedNamesLabel = formatSelectedCompanionNames(selectedCompanions);
  const targetLabel =
    context === 'metrics' ? 'metrics for all matches' : 'all matches';
  const description =
    selectedCompanions.length > 1
      ? `No matches in this session included all selected teammates. Clear the filter to view ${targetLabel}.`
      : `Clear the teammate filter to view ${targetLabel} in this session.`;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <Empty
        title={`No Matches Found with ${selectedNamesLabel}`}
        description={description}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClearFilters}
      >
        Show All Matches
      </Button>
    </div>
  );
}
