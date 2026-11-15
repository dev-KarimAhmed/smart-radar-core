'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatMoney, isTripStartedStatus } from '../services/rider-view-format';
import { resolveColorDisplayName } from '@/shared/services/color-name';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { useTripMutualCancellation } from '@/shared/hooks/use-trip-mutual-cancellation';
import { fetchFavoriteCaptainIds } from '@/features/account/contract';
import { CaptainTripAdsViewer } from './captain-trip-ads-viewer';
import { TripActiveScreenProps } from './trip-active/trip-active-types';
import { TripActiveHeader } from './trip-active/trip-active-header';
import { TripMutualCancelBanner } from './trip-active/trip-mutual-cancel-banner';
import { TripDestinationCard } from './trip-active/trip-destination-card';
import { TripVehicleCard } from './trip-active/trip-vehicle-card';
import { TripActionsPanel } from './trip-active/trip-actions-panel';

export type { TripActiveScreenProps };

export function TripActiveScreen({
  isArabic,
  activeTrip,
  countdown,
  etaSeconds = 0,
  currencyLabel,
  isCancellingRideRequest,
  onEmergencyWhatsapp,
  onCancelRideRequest,
}: TripActiveScreenProps) {
  // [ACT-PWA-02] Keep screen awake during active trip
  useWakeLock(true);

  const t = useTranslations('riderView');
  const remainingSeconds = countdown ? countdown.remainingSeconds : etaSeconds;
  const displayTimer = countdown?.hasCountdown
    ? countdown.display
    : `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`;
  const activeTripStatus = String(activeTrip.status || '').toUpperCase();
  const tripHasStarted = isTripStartedStatus(activeTripStatus);

  const tripDurationMinutes = Math.max(
    1,
    Number(activeTrip.tripDurationMinutes) > 0
      ? Math.round(Number(activeTrip.tripDurationMinutes))
      : Number(activeTrip.distanceKm) > 0
        ? Math.max(5, Math.round(Number(activeTrip.distanceKm) * 2.5))
        : (countdown?.totalSeconds ? Math.round(countdown.totalSeconds / 60) : 20)
  );

  const mutualCancel = useTripMutualCancellation({
    requestId: activeTrip.tripId,
    role: 'rider',
    tripDurationMinutes,
    initialCancelRequestedBy: activeTrip.cancel_requested_by,
    onCancelledConfirmed: onCancelRideRequest,
  });

  const cancelBannerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (mutualCancel.pendingRequestFrom === 'captain') {
      cancelBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [mutualCancel.pendingRequestFrom]);

  const serialNumber = activeTrip.captain?.serial_number
    || (activeTrip.captain as any)?.serial
    || activeTrip.captainId?.slice(0, 8).toUpperCase();

  const captainName = activeTrip.captain?.nickname
    || activeTrip.captain?.full_name
    || activeTrip.captain?.name
    || activeTrip.captainName
    || t('trip.captainFallbackName');

  const plateNumber = activeTrip.captain?.plate_number
    || activeTrip.captain?.license_plate
    || activeTrip.vehiclePlate
    || t('trip.plateFallback');

  const vehicleModel = activeTrip.captain?.vehicle_model
    || activeTrip.vehicleType
    || t('trip.vehicleFallback');

  const vehicleColor = resolveColorDisplayName(activeTrip.captain?.vehicle_color, isArabic ? 'ar' : 'en');

  const captainTargetId = activeTrip.captainId || (activeTrip.captain as any)?.id || (activeTrip as any)?.driverId || '';
  const [isFavorite, setIsFavorite] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined' && captainTargetId) {
      try {
        if (window.localStorage.getItem(`radar_preferred_captain_${captainTargetId}`)) return true;
      } catch {}
    }
    return false;
  });

  React.useEffect(() => {
    if (!captainTargetId) return;
    let isMounted = true;
    void fetchFavoriteCaptainIds().then((favIds) => {
      if (isMounted) {
        setIsFavorite(favIds.has(String(captainTargetId)));
      }
    });

    const handleUpdate = () => {
      void fetchFavoriteCaptainIds().then((favIds) => {
        if (isMounted) setIsFavorite(favIds.has(String(captainTargetId)));
      });
    };
    window.addEventListener('rider-favorites-updated', handleUpdate);
    window.addEventListener('radar_favorites_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('rider-favorites-updated', handleUpdate);
      window.removeEventListener('radar_favorites_updated', handleUpdate);
    };
  }, [captainTargetId]);

  const destinationMapsUrl =
    (activeTrip as any).destinationGoogleMapsUrl
    || ((activeTrip as any).destinationLat && (activeTrip as any).destinationLng
      ? `https://www.google.com/maps/search/?api=1&query=${(activeTrip as any).destinationLat},${(activeTrip as any).destinationLng}`
      : activeTrip.destinationLabel
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeTrip.destinationLabel)}`
        : null);

  return (
    <div className={cn("space-y-3 sm:space-y-3.5", isArabic ? "text-right" : "text-left")} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* 1. الترويسة الرئيسية: بيانات السائق والتايمر الواضح */}
      <TripActiveHeader
        isArabic={isArabic}
        captainName={captainName}
        serialNumber={serialNumber}
        activeTripStatus={activeTripStatus}
        tripHasStarted={tripHasStarted}
        displayTimer={displayTimer}
        isFavorite={isFavorite}
      />

      {/* 1.2. تنبيه طلب الإلغاء بالتوافق المشترك */}
      <TripMutualCancelBanner
        isArabic={isArabic}
        mutualCancel={mutualCancel}
        isCancellingRideRequest={isCancellingRideRequest}
        cancelBannerRef={cancelBannerRef}
      />

      {/* 1.5. إعلانات الكابتن الترويجية - تظهر في شاشة التفاصيل وتختفي فور بدء الرحلة */}
      {!tripHasStarted && captainTargetId ? (
        <CaptainTripAdsViewer
          captainId={captainTargetId}
          isArabic={isArabic}
          isFavoriteCaptain={isFavorite}
        />
      ) : null}

      {/* 2. بطاقة الوجهة المتجه إليها */}
      <TripDestinationCard
        isArabic={isArabic}
        destinationLabel={activeTrip.destinationLabel}
        destinationMapsUrl={destinationMapsUrl}
      />

      {/* 3. صندوق أمان وسلامة الراكب والتحقق من لوحة السيارة */}
      <TripVehicleCard
        isArabic={isArabic}
        plateNumber={plateNumber}
        vehicleModel={vehicleModel}
        vehicleColor={vehicleColor}
      />

      {/* 4. كارد السعر النهائي المحدد */}
      <div className="flex items-center justify-between rounded-2xl border border-[#14B8A6]/25 bg-gradient-to-r from-[#14B8A6]/10 via-[#0B1424] to-[#040812] px-5 py-4 shadow-lg">
        <div>
          <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
            {isArabic ? 'تكلفة الرحلة النهائية' : t('trip.finalCost')}
          </span>
          <span className="block text-[10px] font-bold text-[#14F5D5]/80 mt-0.5">
            {isArabic ? 'المعلن ملتزم بقيمة العرض المقدم' : 'The advertiser is committed to the submitted offer'}
          </span>
        </div>
        <div className="text-end" dir="ltr">
          <span className="text-2xl sm:text-3xl font-black font-mono text-[#14F5D5] drop-shadow-[0_0_10px_rgba(20,245,213,0.3)]">
            {formatMoney(activeTrip.finalPrice, currencyLabel)}
          </span>
        </div>
      </div>

      {/* 5. أزرار الإجراءات */}
      <TripActionsPanel
        isArabic={isArabic}
        activeTrip={activeTrip}
        tripHasStarted={tripHasStarted}
        mutualCancel={mutualCancel}
        isCancellingRideRequest={isCancellingRideRequest}
        onEmergencyWhatsapp={onEmergencyWhatsapp}
        onCancelRideRequest={onCancelRideRequest}
      />
    </div>
  );
}
