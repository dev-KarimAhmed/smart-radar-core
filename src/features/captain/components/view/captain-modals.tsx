'use client';

import React from 'react';
import { supabase } from '@/lib/supabase-client';
import { SovereignPwaInstallModal } from '@/components/sovereign-pwa-install-modal';
import { PricePerKmSetupModal } from '../price-per-km-setup-modal';
import { DriverRatingModal } from '../driver-rating-modal';
import type { CaptainTariff, CaptainTariffSaveResult } from '../../hooks/use-price-per-km-setup';

const styles = {
  modalContainer: 'contents',
} as const;

export interface CaptainModalsProps {
  needsPriceSetup: boolean;
  isManualPriceSetupOpen: boolean;
  activationNonce: number;
  direction: string;
  currency: string;
  currentTariff: any;
  marketIndicator?: any;
  isInDifferentCountry: boolean;
  isActivationConfirm: boolean;
  onSaveTariff: (val: CaptainTariff) => Promise<CaptainTariffSaveResult>;
  onClosePriceSetup: () => void;
  isRatingModalOpen: boolean;
  completedTrip?: { requestId: string; riderId: string; riderName?: string } | null;
  userUid?: string;
  language: string;
  onDismissRating: () => void;
  isInstallModalOpen: boolean;
  onCloseInstallModal: () => void;
}

export function CaptainModals({
  needsPriceSetup,
  isManualPriceSetupOpen,
  activationNonce,
  direction,
  currency,
  currentTariff,
  marketIndicator,
  isInDifferentCountry,
  isActivationConfirm,
  onSaveTariff,
  onClosePriceSetup,
  isRatingModalOpen,
  completedTrip,
  userUid,
  language,
  onDismissRating,
  isInstallModalOpen,
  onCloseInstallModal,
}: CaptainModalsProps) {
  return (
    <div className={styles.modalContainer}>
      {needsPriceSetup || isManualPriceSetupOpen ? (
        <PricePerKmSetupModal
          key={activationNonce}
          direction={direction}
          currency={currency}
          minBaseFare={currentTariff.minBaseFare}
          minBaseFareSource={currentTariff.minBaseFareSource}
          marketAverage={currentTariff.marketAverage}
          marketIndicator={marketIndicator}
          initialTariff={currentTariff}
          isCountryChange={currentTariff.pricePerKm !== null && isInDifferentCountry}
          isActivationConfirm={needsPriceSetup ? isActivationConfirm : false}
          onSave={onSaveTariff}
          onClose={onClosePriceSetup}
        />
      ) : null}

      {isRatingModalOpen && completedTrip && userUid ? (
        <DriverRatingModal
          isOpen={true}
          onClose={onDismissRating}
          language={language === 'en' ? 'en' : 'ar'}
          tripId={completedTrip.requestId}
          riderId={completedTrip.riderId}
          captainId={userUid}
          supabase={supabase}
          riderName={completedTrip.riderName}
          onSuccess={onDismissRating}
        />
      ) : null}

      <SovereignPwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={onCloseInstallModal}
        isArabic={direction === 'rtl'}
        role="captain"
      />
    </div>
  );
}
