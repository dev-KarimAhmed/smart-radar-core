import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { calculateHaversineKm } from '@/lib/road-route';
import type { RiderDestination, RiderMachineScreen } from '../../state/rider-state-machine';
import type { RiderLocation, RiderLocationStatus } from '../../components/rider-map';

export interface ValidateRideRequestParams {
  userId: string | undefined;
  accountSecurityStatus?: string | null;
  locationStatus?: RiderLocationStatus;
  language: AppLanguage;
  t: (key: string) => string;
  toast: (opts: any) => void;
  explicitRiderCount?: number;
  riderCount?: number;
  screen: RiderMachineScreen;
  autoRetryRequested?: boolean;
  activeCountryId: number | undefined;
  effectiveDraftDestination: RiderDestination | null;
  effectiveDestinationCoords: RiderLocation | null;
  riderLocation: RiderLocation;
  isServerFareLoading: boolean;
  isRouteEstimateLoading: boolean;
  currentRouteEstimate: any;
  hasDestinationInState: boolean;
}

export function validateRideRequestInput(params: ValidateRideRequestParams): {
  isValid: boolean;
  effectiveRiderCount: number;
} {
  const {
    userId,
    accountSecurityStatus,
    locationStatus,
    language,
    t,
    toast,
    explicitRiderCount,
    riderCount,
    screen,
    autoRetryRequested,
    activeCountryId,
    effectiveDraftDestination,
    effectiveDestinationCoords,
    riderLocation,
    isServerFareLoading,
    isRouteEstimateLoading,
    currentRouteEstimate,
    hasDestinationInState,
  } = params;

  if (accountSecurityStatus) {
    toast({
      variant: 'destructive',
      title: accountSecurityStatus === 'BANNED'
        ? (language === 'ar' ? 'الحساب محظور نهائياً 🚫' : 'Account Banned 🚫')
        : (language === 'ar' ? 'الحساب معلق مؤقتاً ⚠️' : 'Account Suspended ⚠️'),
      description: language === 'ar'
        ? 'لا يمكن إرسال طلب رحلة، الحساب معلق أو محظور حالياً من قبل الإدارة.'
        : 'Cannot create request: account is currently restricted by platform administration.',
    });
    return { isValid: false, effectiveRiderCount: 0 };
  }

  if (locationStatus === 'denied') {
    toast({
      variant: 'destructive',
      title: t('request.locationPermissionDeniedTitle'),
      description: t('request.locationPermissionDeniedDescription'),
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-system-permissions-modal'));
    }
    return { isValid: false, effectiveRiderCount: 0 };
  }

  if (!userId) {
    toast({
      variant: 'destructive',
      title: t('request.loginRequiredTitle'),
      description: t('request.loginRequiredDescription'),
    });
    return { isValid: false, effectiveRiderCount: 0 };
  }

  let liveStorageCount = 0;
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('radar_rider_passenger_count');
      const parsed = stored ? parseInt(stored, 10) : 0;
      if (Number.isFinite(parsed) && parsed >= 1) liveStorageCount = parsed;
    } catch {}
  }

  let effectiveCount = (typeof explicitRiderCount === 'number' && explicitRiderCount >= 1)
    ? explicitRiderCount
    : (typeof riderCount === 'number' && riderCount >= 1)
      ? riderCount
      : (liveStorageCount >= 1)
        ? liveStorageCount
        : 0;

  if ((screen === 'RECEIVING_OFFERS' || autoRetryRequested) && effectiveCount < 1) {
    effectiveCount = 1;
  }

  if (effectiveCount < 1) {
    toast({
      variant: 'destructive',
      title: t('request.passengersMissingTitle'),
      description: t('request.passengersMissingDescription'),
    });
    return { isValid: false, effectiveRiderCount: 0 };
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('radar_rider_passenger_count', String(effectiveCount));
    } catch {}
  }

  const countryId = Number(activeCountryId);
  if (!Number.isInteger(countryId) || countryId <= 0) {
    toast({
      variant: 'destructive',
      title: t('request.countryMissingTitle'),
      description: t('request.countryMissingDescription'),
    });
    return { isValid: false, effectiveRiderCount: 0 };
  }

  if (!effectiveDraftDestination || !effectiveDestinationCoords) {
    toast({
      variant: 'destructive',
      title: t('request.destinationNotReadyTitle'),
      description: t('request.destinationNotReadyDescription'),
    });
    return { isValid: false, effectiveRiderCount: 0 };
  }

  const directDistanceKm =
    effectiveDraftDestination.fareQuote?.straightDistanceKm ??
    calculateHaversineKm(riderLocation, effectiveDestinationCoords);

  if (directDistanceKm < 0.1) {
    toast({
      variant: 'destructive',
      title: t('request.sameLocationTitle'),
      description: t('request.sameLocationDescription'),
    });
    return { isValid: false, effectiveRiderCount: 0 };
  }

  if (
    effectiveDraftDestination.serverEstimatedFare === undefined ||
    (isServerFareLoading && !hasDestinationInState) ||
    (isRouteEstimateLoading && !hasDestinationInState) ||
    (!currentRouteEstimate && !hasDestinationInState)
  ) {
    toast({
      variant: 'destructive',
      title: t('request.fareNotReadyTitle'),
      description: t('request.fareNotReadyDescription'),
    });
    return { isValid: false, effectiveRiderCount: 0 };
  }

  return { isValid: true, effectiveRiderCount: effectiveCount };
}

