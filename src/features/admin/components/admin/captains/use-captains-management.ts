import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useCaptainsFilters } from './use-captains-filters';
import { useCaptainsDialogs } from './use-captains-dialogs';

export function useCaptainsManagement() {
  const { direction } = useDashboardLanguage();
  const filters = useCaptainsFilters();
  const dialogs = useCaptainsDialogs({
    fetchCaptains: filters.fetchCaptains,
    captains: filters.captains,
    filteredCaptains: filters.filteredCaptains,
    selectedCaptainIds: filters.selectedCaptainIds,
  });

  return {
    ...filters,
    ...dialogs,
    direction,
  };
}
