'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Zap } from 'lucide-react';
import { useRiderOperations } from '../hooks/use-rider-operations';
import { useLocaleContext } from '@/components/providers/locale-provider';
import { useTranslations } from 'next-intl';

import { styles, destinationOptionsFn } from './request-ride-modal/request-modal-shared';
import { DestinationStep } from './request-ride-modal/destination-step';
import { DistanceStep } from './request-ride-modal/distance-step';
import { OptionsStep } from './request-ride-modal/options-step';
import { ModalFooter } from './request-ride-modal/modal-footer';

/**
 * [SCR-2026-055] منصة الإطلاق الماسية (Advanced Disclosure Version V5.2)
 * مجهزة بمرجعية الأوامر الثابتة وقانون التوازن المالي والجغرافي.
 */
export function RequestRideModal() {
  const { currentLocale } = useLocaleContext();
  const isArabic = currentLocale === 'ar';
  const t = useTranslations('requestRide');

  const {
    isRequestModalOpen, closeRequestModal,
    seats, setSeats,
    dropoff, setDropoff,
    pickup, setPickup,
    pricingPreference, setPricingPreference,
    isResolvingUrl,
    requestRide, isRequesting,
    estimatedDistance, estimatedTime,
    isLocationConfirmed, calculateSovereignMetrics,
    resetLocationMetrics,
    isRadarActive
  } = useRiderOperations()!;

  const destinationOptions = destinationOptionsFn(t);
  const selectedDestination = destinationOptions.find((option) => option.label === dropoff);
  const isBlindSpot = estimatedDistance > 0 && estimatedDistance < 0.1;

  return (
    <Dialog open={isRequestModalOpen} onOpenChange={(open) => !open && closeRequestModal()}>
      <DialogContent className={styles.style47_1} dir={isArabic ? 'rtl' : 'ltr'}>
        <div className={styles.style49_2}>
          <DialogHeader>
            <DialogTitle className={styles.style51_3}>
              <Zap className={styles.style52_4} />
              {t('title')}
            </DialogTitle>
            <DialogDescription className={styles.style55_5}>
              {t('description')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className={styles.style61_6}>
          <DestinationStep
            selectedDestination={selectedDestination}
            destinationOptions={destinationOptions}
            resetLocationMetrics={resetLocationMetrics}
            setDropoff={setDropoff}
            setPickup={setPickup}
          />

          <DistanceStep
            pickup={pickup}
            setPickup={setPickup}
            isResolvingUrl={isResolvingUrl}
            isLocationConfirmed={isLocationConfirmed}
            calculateSovereignMetrics={calculateSovereignMetrics}
            resetLocationMetrics={resetLocationMetrics}
            estimatedDistance={estimatedDistance}
            estimatedTime={estimatedTime}
            isBlindSpot={isBlindSpot}
          />

          <OptionsStep
            seats={seats}
            setSeats={setSeats}
            pricingPreference={pricingPreference}
            setPricingPreference={setPricingPreference}
          />
        </div>

        <ModalFooter
          isRadarActive={isRadarActive}
          requestRide={requestRide}
          isRequesting={isRequesting}
          isLocationConfirmed={isLocationConfirmed}
          dropoff={dropoff}
        />
      </DialogContent>
    </Dialog>
  );
}
