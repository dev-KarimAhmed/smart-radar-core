'use client';

import React from 'react';
import { Lock, MapPinOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderDestination } from '../state/rider-state-machine';
import type { useDestinationGeographyData } from '../hooks/use-destination-geography-data';
import type { useDestinationTextSearch } from '../hooks/use-destination-text-search';
import type { useDestinationMapPicker } from '../hooks/use-destination-map-picker';
import type { useClipboardLocationImport } from '../hooks/use-clipboard-location-import';
import type { useServerFareAndRoute } from '../hooks/use-server-fare-and-route';
import type { RiderLocation, RiderLocationStatus } from './rider-map';
import { formatMoney } from '../services/rider-view-format';
import { DestinationSearchPanel } from './destination-search-panel';
import { DestinationTripSummary } from './destination-trip-summary';

const SAME_LOCATION_THRESHOLD_KM = 0.1;

const styles = {
  wrapper: "space-y-3 pb-20 lg:pb-4",
  inner: "space-y-3",
  header: "flex items-start justify-between gap-3",
  headerText: "min-w-0",
  eyebrow: "text-[11px] font-black text-[#14F5D5]",
  title: "mt-1 text-2xl font-black leading-tight text-white",
  subtitle: "mt-1 text-xs leading-relaxed text-slate-400",
  countryBadge: "shrink-0 rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-1.5 text-[10px] font-black text-[#14F5D5]",
} as const;

export interface DestinationSelectionScreenProps {
  isArabic: boolean;
  language: AppLanguage;
  locationStatus?: RiderLocationStatus;
  geography: ReturnType<typeof useDestinationGeographyData>;
  search: ReturnType<typeof useDestinationTextSearch>;
  mapPicker: ReturnType<typeof useDestinationMapPicker>;
  clipboard: ReturnType<typeof useClipboardLocationImport>;
  fareAndRoute: ReturnType<typeof useServerFareAndRoute>;
  countryConfig: { name_ar?: string | null; name_en?: string | null } | null;
  currencyLabel: string;
  selectedDraftDestination: RiderDestination | null;
  selectedDestinationCoords: RiderLocation | null;
  /** Resolved name of the pinned point; overrides the district label when present. */
  pinnedPlaceLabel: string;
  isDestinationPinMoving: boolean;
  riderCount: number;
  setRiderCount: (updater: (current: number) => number) => void;
  pricingPreference: 'APP' | 'TAXI' | 'FREE' | null;
  setPricingPreference: (pref: 'APP' | 'TAXI' | 'FREE' | null) => void;
  isSendingRideRequest: boolean;
  isCaptainScanPreviewActive: boolean;
  nearbyCaptainCount: number;
  onGovernorateChange: (governorateId: string) => void;
  onDistrictChange: (districtId: string) => void;
  onSendRequest: () => void;
  onResetDraft?: () => void;
  onCancelPreview?: () => void;
}

export function DestinationSelectionScreen({
  isArabic,
  language,
  locationStatus,
  geography,
  search,
  mapPicker,
  clipboard,
  fareAndRoute,
  countryConfig,
  currencyLabel,
  selectedDraftDestination,
  selectedDestinationCoords,
  pinnedPlaceLabel,
  isDestinationPinMoving,
  riderCount,
  setRiderCount,
  pricingPreference,
  setPricingPreference,
  isSendingRideRequest,
  isCaptainScanPreviewActive,
  nearbyCaptainCount,
  onGovernorateChange,
  onDistrictChange,
  onSendRequest,
  onResetDraft,
  onCancelPreview,
}: DestinationSelectionScreenProps) {
  const locationCopy = useTranslations('location');
  const t = useTranslations('riderView');

  const [isLocationDisabled, setIsLocationDisabled] = React.useState(
    locationStatus === 'denied'
  );

  React.useEffect(() => {
    if (locationStatus === 'denied') {
      setIsLocationDisabled(true);
    } else if (locationStatus === 'live' || locationStatus === 'locating') {
      setIsLocationDisabled(false);
    }
  }, [locationStatus]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((res) => {
        if (res.state === 'denied') {
          setIsLocationDisabled(true);
        } else if (res.state === 'granted') {
          setIsLocationDisabled(false);
        }
        res.onchange = () => {
          if (res.state === 'denied') {
            setIsLocationDisabled(true);
          } else if (res.state === 'granted') {
            setIsLocationDisabled(false);
          }
        };
      }).catch(() => undefined);
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setIsLocationDisabled(false),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setIsLocationDisabled(true);
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }

    const handleDenied = () => setIsLocationDisabled(true);
    const handleGranted = () => setIsLocationDisabled(false);

    window.addEventListener('system-location-denied', handleDenied);
    window.addEventListener('system-location-granted', handleGranted);

    return () => {
      window.removeEventListener('system-location-denied', handleDenied);
      window.removeEventListener('system-location-granted', handleGranted);
    };
  }, []);

  const handleRequestLocation = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('request-live-location'));
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setIsLocationDisabled(false);
            window.dispatchEvent(new CustomEvent('system-location-granted'));
            window.dispatchEvent(new CustomEvent('request-live-location'));
          },
          (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              setIsLocationDisabled(true);
              window.dispatchEvent(new CustomEvent('open-system-permissions-modal'));
              window.dispatchEvent(new CustomEvent('system-location-denied'));
            } else {
              navigator.geolocation.getCurrentPosition(
                () => {
                  setIsLocationDisabled(false);
                  window.dispatchEvent(new CustomEvent('system-location-granted'));
                  window.dispatchEvent(new CustomEvent('request-live-location'));
                },
                (err2) => {
                  if (err2.code === err2.PERMISSION_DENIED) {
                    setIsLocationDisabled(true);
                    window.dispatchEvent(new CustomEvent('open-system-permissions-modal'));
                    window.dispatchEvent(new CustomEvent('system-location-denied'));
                  }
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
              );
            }
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      }
    }
  };

  const hasDestinationOptions = geography.destinationGovernorates.length > 0 && geography.destinationDistricts.length > 0;
  const selectedDestinationHasCoords = !!selectedDestinationCoords;
  const { isServerFareLoading, isRouteEstimateLoading, currentRouteEstimate, serverFareError } = fareAndRoute;

  const serverFareLabel =
    isServerFareLoading || isDestinationPinMoving
      ? t('fare.updating')
      : selectedDraftDestination?.serverEstimatedFare !== undefined
        ? formatMoney(selectedDraftDestination.serverEstimatedFare, currencyLabel)
        : t('destination.notAvailable');

  // Real straight-line distance, not H3-cell equality — resolution-9 cells are
  // ~350m wide, so comparing cell IDs falsely flagged destinations several
  // hundred meters from the rider (e.g. right after a trip ends nearby) as
  // "same location". SAME_LOCATION_THRESHOLD_KM only catches genuinely
  // unmoved selections, not district-anchor/GPS coincidences.
  const straightDistanceKm = selectedDraftDestination?.fareQuote?.straightDistanceKm;
  const isSameLocation = straightDistanceKm !== undefined && straightDistanceKm < SAME_LOCATION_THRESHOLD_KM;
  const estimatedDistanceKm = currentRouteEstimate?.distanceKm ?? null;
  const estimatedDurationMinutes = currentRouteEstimate?.durationMinutes ?? null;
  const hasImportedLocation = clipboard.externalLocationUrl.length > 0;
  const destinationReady =
    selectedDestinationHasCoords &&
    selectedDraftDestination?.serverEstimatedFare !== undefined &&
    currentRouteEstimate !== null &&
    !isServerFareLoading &&
    !isRouteEstimateLoading &&
    !isDestinationPinMoving &&
    !isSameLocation;
  const districtLabel = geography.externalLocationContext
    ? [geography.externalLocationContext.district, geography.externalLocationContext.governorate].filter(Boolean).join(' - ')
    : geography.selectedDistrict
      ? isArabic
        ? [geography.selectedDistrict.districtAr, geography.selectedDistrict.governorateAr].filter(Boolean).join(' - ')
        : [geography.selectedDistrict.districtEn || geography.selectedDistrict.districtAr, geography.selectedDistrict.governorateEn || geography.selectedDistrict.governorateAr].filter(Boolean).join(' - ')
      : t('destination.notAvailable');

  // The pin wins when it has one: it is what the trip is actually priced and driven to.
  const destinationLabel = pinnedPlaceLabel || districtLabel;

  return (
    <div className={styles.wrapper} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>{t('destination.eyebrow')}</p>
            <h2 className={styles.title}>{t('panel.whereTo')}</h2>
            <p className={styles.subtitle}>{locationCopy('flow_helper')}</p>
          </div>
          {countryConfig?.name_ar || countryConfig?.name_en ? (
            <span className={styles.countryBadge}>
              {isArabic ? countryConfig.name_ar || countryConfig.name_en : countryConfig.name_en || countryConfig.name_ar}
            </span>
          ) : null}
        </div>
      </div>

      {/* Location Disabled Critical Notice */}
      {isLocationDisabled && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 space-y-2 text-start shadow-lg shadow-rose-950/30 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-rose-300 font-black text-xs sm:text-sm">
            <MapPinOff className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{isArabic ? 'إذن الموقع الجغرافي (GPS) مغلق' : 'Location Permission Disabled'}</span>
          </div>
          <p className="text-[11px] sm:text-xs leading-relaxed text-slate-200 font-medium">
            {isArabic
              ? 'لن تتمكن من تحديد نقطة انطلاقك أو إرسال طلب رحلة للكباتن دون تفعيل الموقع. يجب تفعيل إذن الموقع للمتابعة.'
              : 'You cannot determine your pickup location or request a ride without location access. Please enable location to continue.'}
          </p>
          <p className="text-[10px] text-amber-300/90 leading-tight">
            {isArabic
              ? '💡 لمستخدمي آيفون: إن كان مفعلاً في سفاري، تأكد أيضاً من (إعدادات الآيفون ⚙️ ➔ الخصوصية والأمن ➔ خدمات الموقع ➔ مواقع Safari ➔ أثناء استخدام التطبيق).'
              : '💡 iPhone users: If allowed in Safari, also verify (iPhone Settings ⚙️ ➔ Privacy & Security ➔ Location Services ➔ Safari Websites ➔ While Using App).'}
          </p>
          <button
            type="button"
            onClick={handleRequestLocation}
            className="min-h-[44px] w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm py-2.5 rounded-xl transition-transform active:scale-[0.98] shadow-md shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer border border-rose-400/30"
          >
            <Lock className="h-4 w-4" />
            <span>{isArabic ? 'تفعيل إذن الموقع لبدء الطلب' : 'Enable Location to Request'}</span>
          </button>
        </div>
      )}

      <DestinationSearchPanel
        search={search}
        mapPicker={mapPicker}
        clipboard={clipboard}
        isRouteEstimateLoading={isRouteEstimateLoading}
        currentRouteEstimate={currentRouteEstimate}
        isCaptainScanPreviewActive={isCaptainScanPreviewActive}
        nearbyCaptainCount={nearbyCaptainCount}
        onResetDraft={onResetDraft}
        onCancelPreview={onCancelPreview}
      />

      {isSameLocation && selectedDestinationCoords && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs font-bold text-amber-300">
          ⚠️ موقع الوجهة مطابق لموقعك الحالي. يرجى البحث أو اختيار وجهة تريد الذهاب إليها.
        </div>
      )}

      {Boolean((selectedDestinationCoords && !isSameLocation) || isCaptainScanPreviewActive) && (
        <DestinationTripSummary
          riderCount={riderCount}
          setRiderCount={setRiderCount}
          pricingPreference={pricingPreference}
          setPricingPreference={setPricingPreference}
          destinationDataError={geography.destinationDataError}
          destinationReady={destinationReady}
          isServerFareLoading={isServerFareLoading}
          isDestinationPinMoving={isDestinationPinMoving}
          destinationLabel={destinationLabel}
          selectedDestinationCoords={selectedDestinationCoords}
          hasDestinationCoordsAnchor={!!geography.selectedDistrict?.anchor && !!selectedDestinationCoords}
          serverFareLabel={serverFareLabel}
          isRouteEstimateLoading={isRouteEstimateLoading}
          estimatedDurationMinutes={estimatedDurationMinutes}
          estimatedDistanceKm={estimatedDistanceKm}
          nearbyCaptainCount={nearbyCaptainCount}
          serverFareError={serverFareError}
          isSameLocation={isSameLocation}
          isSendingRideRequest={isSendingRideRequest}
          hasDestinationOptions={hasDestinationOptions}
          selectedDestinationHasCoords={selectedDestinationHasCoords}
          hasServerEstimatedFare={selectedDraftDestination?.serverEstimatedFare !== undefined}
          isCaptainScanPreviewActive={isCaptainScanPreviewActive}
          isLocationDisabled={isLocationDisabled}
          onEnableLocation={handleRequestLocation}
          onSendRequest={onSendRequest}
        />
      )}
    </div>
  );
}
