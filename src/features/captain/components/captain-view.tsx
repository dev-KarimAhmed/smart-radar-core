'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import type { Trip } from '@/core/types';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useActiveTripReloadGuard } from '@/shared/hooks/use-active-trip-reload-guard';
import { useNotifications } from '@/shared/hooks/use-notifications';
import { useDriverOperations } from '../hooks/use-driver-operations';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import { useToast } from '@/hooks/use-toast';
import { useDeviceTimeGuard } from '../hooks/use-device-time-guard';
import { useConnectionGuard } from '../hooks/use-connection-guard';
import { usePricePerKmSetup } from '../hooks/use-price-per-km-setup';
import { useCaptainMarketIndicator } from '../hooks/use-captain-market-indicator';
import { useCountryConfig } from '@/shared/hooks/use-country-config';
import { getCurrencyLabel } from '@/shared/services/currency-label';
import { useLiveCurrencyFromLocation } from '@/shared/hooks/use-live-currency-from-location';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import {
  captainDashboardReducer,
  initialCaptainDashboardState,
} from '../state/captain-state-machine';
import { useCaptainSyncEffects } from '../hooks/use-captain-sync-effects';
import { CaptainHeader } from './view/captain-header';
import { CaptainBanners } from './view/captain-banners';
import { CaptainBottomNav } from './view/captain-bottom-nav';
import { CaptainSecurityScreens } from './view/captain-security-screens';
import { CaptainMainContent } from './view/captain-main-content';
import { CaptainModals } from './view/captain-modals';

const styles = {
  root: 'min-h-screen w-full max-w-full overflow-x-hidden bg-[#0B0F19] p-2.5 pb-24 text-white sm:p-3 sm:pb-12 md:p-5',
  inner: 'mx-auto flex w-full max-w-[1800px] min-w-0 flex-col gap-3 sm:gap-4',
  loading: 'flex min-h-[60vh] items-center justify-center text-slate-400',
  loadingIcon: 'mr-2 h-5 w-5 animate-spin',
} as const;

export function DriverViewTab() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { language, direction, toggleLanguage } = useDashboardLanguage();
  const t = useTranslations('captainDashboard');
  const { unreadCount, hasUnread } = useNotifications();
  const driverOps = useDriverOperations();
  const wallet = useSovereignWallet(user);
  const { isTimeTamperingDetected } = useDeviceTimeGuard();
  const { isOffline, isReconnecting } = useConnectionGuard();
  const countryConfig = useCountryConfig(user?.countryId);
  const { canShowInstallButton, canPromptNative, triggerNativeInstall } = usePwaInstall('captain');
  const [isInstallModalOpen, setIsInstallModalOpen] = React.useState(false);
  const isDriverLocationLive = driverOps?.driverLocation && (driverOps.driverLocation as { source?: string }).source === 'gps';
  const { currencyCode: liveCurrencyCode, countryCode: liveCountryCode } = useLiveCurrencyFromLocation(
    isDriverLocationLive ? driverOps?.driverLocation : null,
  );
  const isInDifferentCountry = Boolean(
    liveCountryCode && countryConfig?.iso_code && liveCountryCode.toUpperCase() !== countryConfig.iso_code.toUpperCase(),
  );
  const { needsPriceSetup, isActivationConfirm, currentTariff, saveTariff, dismissPriceSetup } = usePricePerKmSetup(
    user,
    isInDifferentCountry,
    driverOps?.activationNonce ?? 0,
  );
  const [isManualPriceSetupOpen, setIsManualPriceSetupOpen] = React.useState(false);

  const handleClosePriceSetup = React.useCallback(() => {
    setIsManualPriceSetupOpen(false);
    dismissPriceSetup();
    if (needsPriceSetup && isActivationConfirm && driverOps?.driverStatus === 'active') {
      void driverOps.toggleDriverStatus('idle');
    }
  }, [dismissPriceSetup, needsPriceSetup, isActivationConfirm, driverOps]);

  const { marketIndicator } = useCaptainMarketIndicator(user);
  const [state, dispatch] = React.useReducer(captainDashboardReducer, initialCaptainDashboardState);
  const [_prefilledOfferPrice, setPrefilledOfferPrice] = React.useState<number | null>(null);
  const [_prefilledPricingMode, setPrefilledPricingMode] = React.useState<'FREE' | 'APP' | 'TAXI' | null>(null);
  const screen = state.screen === 'ACTIVE_TRIP' && !driverOps?.activeRequest ? 'RADAR_MAP' : state.screen;
  useActiveTripReloadGuard(screen === 'ACTIVE_TRIP');

  useCaptainSyncEffects({ driverOps, isOffline, state, dispatch, toast, t });

  if (!driverOps) {
    return <div className={styles.loading}><Loader2 className={styles.loadingIcon} />{t('loading')}</div>;
  }

  const securityScreen = (
    <CaptainSecurityScreens
      isTimeTamperingDetected={isTimeTamperingDetected}
      accountSecurityStatus={driverOps.accountSecurityStatus}
      direction={direction}
      onLogout={() => void logout()}
    />
  );
  if (isTimeTamperingDetected || driverOps.accountSecurityStatus === 'BANNED' || driverOps.accountSecurityStatus === 'SUSPENDED') {
    return securityScreen;
  }

  const isActive = driverOps.driverStatus === 'active' || driverOps.driverStatus === 'busy';
  const walletIsReady = wallet.walletLoadState === 'ready';
  const paidMinutes = walletIsReady ? wallet.paidMinutesRemaining : 0;
  const bonusMinutes = walletIsReady ? wallet.bonusMinutesRemaining : 0;
  const currency = liveCurrencyCode || getCurrencyLabel(countryConfig, user, language);

  const submitBid = async (price: number, waitSeconds: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => {
    if (!state.selectedRequest) return;
    const ok = await driverOps.submitOffer({ tripId: state.selectedRequest.id, offerPrice: price, waitSeconds, pricingMode });
    if (ok) dispatch({ type: 'OFFER_SUBMITTED', requestId: state.selectedRequest.id });
  };

  const submitDirectBid = async (request: Trip, price: number, waitSeconds = 120, pricingMode?: 'FREE' | 'APP' | 'TAXI') => {
    const ok = await driverOps.submitOffer({ tripId: request.id, offerPrice: price, waitSeconds, pricingMode });
    if (ok) dispatch({ type: 'OFFER_SUBMITTED', requestId: request.id });
  };

  const selectRequest = (request: Trip, initialPrice?: string | number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => {
    const parsed = initialPrice ? parseFloat(String(initialPrice)) : null;
    setPrefilledOfferPrice(parsed && !isNaN(parsed) && parsed > 0 ? parsed : null);
    setPrefilledPricingMode(pricingMode ?? null);
    dispatch({ type: 'SELECT_REQUEST', request });
  };

  const completeTrip = async () => {
    const trip = driverOps.activeRequest;
    const riderId = trip?.riderId || driverOps.acceptedRider?.uid || '';
    const riderName = driverOps.acceptedRider?.name;
    const requestId = trip?.id || '';
    const ok = await driverOps.endTrip();
    if (!ok) return;
    if (requestId && riderId) {
      dispatch({
        type: 'TRIP_COMPLETED',
        completedTrip: { requestId, riderId, riderName },
      });
    }
  };

  return (
    <div className={styles.root} dir={direction}>
      <div className={styles.inner}>
        <CaptainHeader
          screen={screen}
          direction={direction}
          isActive={isActive}
          isOffline={isOffline}
          isReconnecting={isReconnecting}
          isUpdatingStatus={driverOps.isUpdatingStatus}
          unreadCount={unreadCount}
          hasUnread={hasUnread}
          marketIndicator={marketIndicator}
          onToggleStatus={() => void driverOps.toggleDriverStatus(isActive ? 'idle' : 'active')}
          onOpenNotifications={() => dispatch({ type: 'OPEN_NOTIFICATIONS' })}
          onToggleLanguage={toggleLanguage}
          onLogout={() => void logout()}
          onOpenWallet={() => dispatch({ type: 'OPEN_WALLET' })}
          onOpenHistory={() => dispatch({ type: 'OPEN_HISTORY' })}
          onOpenProfile={() => dispatch({ type: 'OPEN_PROFILE' })}
        />

        <CaptainBanners
          direction={direction}
          hasActiveRequest={Boolean(driverOps.activeRequest)}
          screen={screen}
          isDormancyWarningVisible={driverOps.isDormancyWarningVisible}
          isOffline={isOffline}
          isReconnecting={isReconnecting}
          pendingOfferRequestId={driverOps.pendingOfferRequestId}
          isCancellingOffer={driverOps.isCancellingOffer}
          onCancelOffer={driverOps.cancelOffer}
          onReturnToTrip={() => dispatch({ type: 'OPEN_RADAR' })}
          onResetDormancy={() => driverOps.resetDormancyTimer()}
        />

        <CaptainMainContent
          screen={screen}
          direction={direction}
          language={language}
          isActive={isActive}
          isOffline={isOffline}
          isReconnecting={isReconnecting}
          user={user}
          driverOps={driverOps}
          currency={currency}
          paidMinutes={paidMinutes}
          bonusMinutes={bonusMinutes}
          tripStep={state.tripStep}
          selectedRequest={state.selectedRequest}
          currentTariff={currentTariff}
          onOpenRadar={() => dispatch({ type: 'OPEN_RADAR' })}
          onConfirmArrival={async () => {
            const ok = await driverOps.markArrivedAtPickup();
            if (ok) dispatch({ type: 'CONFIRM_ARRIVAL' });
          }}
          onStartTrip={async () => {
            const ok = await driverOps.startTrip();
            if (ok) dispatch({ type: 'START_TRIP' });
          }}
          onCompleteTrip={completeTrip}
          onSelectRequest={selectRequest}
          onSubmitDirectBid={submitDirectBid}
          onSubmitBid={submitBid}
          onOpenPriceSetup={() => setIsManualPriceSetupOpen(true)}
          dispatch={dispatch}
        />
      </div>

      <CaptainModals
        needsPriceSetup={needsPriceSetup}
        isManualPriceSetupOpen={isManualPriceSetupOpen}
        activationNonce={driverOps?.activationNonce ?? 0}
        direction={direction}
        currency={currency}
        currentTariff={currentTariff}
        marketIndicator={marketIndicator}
        isInDifferentCountry={isInDifferentCountry}
        isActivationConfirm={isActivationConfirm}
        onSaveTariff={async (val) => {
          const res = await saveTariff(val);
          if (res.saved) setIsManualPriceSetupOpen(false);
          return res;
        }}
        onClosePriceSetup={handleClosePriceSetup}
        isRatingModalOpen={screen === 'RATING_MODAL'}
        completedTrip={state.completedTrip}
        userUid={user?.uid}
        language={language}
        onDismissRating={() => dispatch({ type: 'RATING_DISMISSED' })}
        isInstallModalOpen={isInstallModalOpen}
        onCloseInstallModal={() => setIsInstallModalOpen(false)}
      />

      <CaptainBottomNav
        screen={screen}
        onSelectTab={(tab) => dispatch({ type: screen === tab ? 'OPEN_RADAR' : (`OPEN_${tab}` as any) })}
      />
    </div>
  );
}
