import type { User } from '@/core/types';

export function resolveDefaultPricingMode(
  user: User | null,
  initialTariffMode?: 'FREE' | 'APP' | 'TAXI' | null,
): 'FREE' | 'APP' | 'TAXI' {
  const rawAffiliationType = (user?.affiliation?.type || '').toLowerCase();
  const rawAffiliationName = (user?.affiliation?.name || '').toLowerCase();
  const vehicleType = String((user?.vehicle as any)?.type || (user?.vehicle as any)?.category || '').toUpperCase();

  const isIndependent = user?.subRole === 'independent'
    || rawAffiliationType === 'independent'
    || rawAffiliationName === 'مستقل'
    || rawAffiliationName === 'independent';

  if (isIndependent) return 'FREE';

  const isOfficeTaxi = rawAffiliationType === 'office-taxi'
    || rawAffiliationType.includes('taxi')
    || rawAffiliationName.includes('تاكسي')
    || rawAffiliationName.includes('مكتب')
    || vehicleType === 'TAXI';

  if (isOfficeTaxi) return 'TAXI';

  const isSmartApp = rawAffiliationType === 'smart-app'
    || rawAffiliationType.includes('app')
    || Boolean(rawAffiliationName);

  if (isSmartApp) return 'APP';

  if (initialTariffMode === 'TAXI' || initialTariffMode === 'APP' || initialTariffMode === 'FREE') {
    return initialTariffMode;
  }

  return 'FREE';
}
