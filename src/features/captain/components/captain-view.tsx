'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
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
import { resolveUserCurrency, getCurrencyLabel } from '@/shared/services/currency-label';
import { useLiveCurrencyFromLocation } from '@/shared/hooks/use-live-currency-from-location';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { captainDashboardReducer, initialCaptainDashboardState } from '../state/captain-state-machine';
import { useCaptainSyncEffects } from '../hooks/use-captain-sync-effects';
import { useCaptainViewController } from '../hooks/use-captain-view-controller';
import { CaptainHeader } from './view/captain-header';
import { CaptainBanners } from './view/captain-banners';
import { CaptainBottomNav } from './view/captain-bottom-nav';
import { CaptainSecurityScreens } from './view/captain-security-screens';
import { CaptainMainContent } from './view/captain-main-content';
import { CaptainModals } from './view/captain-modals';
import { CaptainAdPackageModal } from './ads-seats/captain-ad-package-modal';
import { CaptainPackageActivatedModal } from './ads-seats/captain-package-activated-modal';

const styles = {
  root: 'min-h-screen w-full max-w-full overflow-x-hidden bg-[#0B0F19] p-2.5 pb-24 text-white sm:p-3 sm:pb-12 md:p-5',
  rootAdStandby: 'flex h-dvh w-full max-w-full flex-col overflow-hidden bg-[#0B0F19] p-2 pb-[4.5rem] text-white sm:p-3 sm:pb-3 md:p-5',
  inner: 'mx-auto flex w-full max-w-[1800px] min-w-0 flex-col gap-3 sm:gap-4',
  innerAdStandby: 'mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col gap-2 sm:gap-3',
  loading: 'flex min-h-[60vh] items-center justify-center text-slate-400',
  loadingIcon: 'mr-2 h-5 w-5 animate-spin',
} as const;

export function DriverViewTab() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { language, direction, toggleLanguage } = useDashboardLanguage();
  const t = useTranslations('captainDashboard');
  const { adminUnreadCount, hasAdminUnread, tripUnreadCount, hasTripUnread } = useNotifications();
  const driverOps = useDriverOperations();
  const wallet = useSovereignWallet(user);
  const { isTimeTamperingDetected } = useDeviceTimeGuard();
  const { isOffline, isReconnecting } = useConnectionGuard();
  const countryConfig = useCountryConfig(user?.countryId);
  const { isStandalone } = usePwaInstall('captain');

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

  const { marketIndicator } = useCaptainMarketIndicator(user);
  const [state, dispatch] = React.useReducer(captainDashboardReducer, initialCaptainDashboardState);
  const screen = state.screen === 'ACTIVE_TRIP' && !driverOps?.activeRequest ? 'RADAR_MAP' : state.screen;
  useActiveTripReloadGuard(screen === 'ACTIVE_TRIP');

  useCaptainSyncEffects({ driverOps, isOffline, state, dispatch, toast, t });

  const vc = useCaptainViewController({
    user,
    driverOps,
    wallet,
    currentTariff,
    state,
    dispatch,
    dismissPriceSetup,
    isStandalone,
  });

  if (!driverOps) {
    return <div className={styles.loading}><Loader2 className={styles.loadingIcon} />{t('loading')}</div>;
  }

  if (isTimeTamperingDetected || driverOps.accountSecurityStatus === 'BANNED' || driverOps.accountSecurityStatus === 'SUSPENDED') {
    return (
      <CaptainSecurityScreens
        isTimeTamperingDetected={isTimeTamperingDetected}
        accountSecurityStatus={driverOps.accountSecurityStatus}
        direction={direction}
        onLogout={() => void logout()}
      />
    );
  }

  const isActive = driverOps.driverStatus === 'active' || driverOps.driverStatus === 'busy';
  const isAdStandby = screen === 'RADAR_MAP' && !driverOps.activeRequest && !isActive;
  const walletIsReady = wallet.walletLoadState === 'ready';
  const paidMinutes = walletIsReady ? wallet.paidMinutesRemaining : 0;
  const bonusMinutes = walletIsReady ? wallet.bonusMinutesRemaining : 0;
  const currency = liveCurrencyCode || getCurrencyLabel(countryConfig, user, language);

  return (
    <div className={isAdStandby ? styles.rootAdStandby : styles.root} dir={direction}>
      <div className={isAdStandby ? styles.innerAdStandby : styles.inner}>
        <CaptainHeader
          screen={screen}
          direction={direction}
          isActive={isActive}
          isOffline={isOffline}
          isReconnecting={isReconnecting}
          isUpdatingStatus={driverOps.isUpdatingStatus}
          unreadCount={adminUnreadCount}
          hasUnread={hasAdminUnread}
          historyUnreadCount={tripUnreadCount}
          hasHistoryUnread={hasTripUnread}
          marketIndicator={marketIndicator}
          user={user}
          onToggleStatus={vc.handleToggleCaptainStatus}
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
          cancelCooldown={driverOps.cancelCooldown}
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
          onCompleteTrip={vc.completeTrip}
          onSelectRequest={vc.selectRequest}
          onSubmitDirectBid={vc.submitDirectBid}
          onSubmitBid={vc.submitBid}
          onOpenPriceSetup={() => vc.setIsManualPriceSetupOpen(true)}
          dispatch={dispatch}
        />
      </div>

      <CaptainModals
        needsPriceSetup={needsPriceSetup || vc.isPendingActivation}
        isManualPriceSetupOpen={vc.isManualPriceSetupOpen}
        activationNonce={driverOps?.activationNonce ?? 0}
        direction={direction}
        currency={currency}
        currentTariff={currentTariff}
        marketIndicator={marketIndicator}
        isInDifferentCountry={isInDifferentCountry}
        isActivationConfirm={vc.isPendingActivation || isActivationConfirm}
        onSaveTariff={async (val) => {
          const res = await saveTariff(val);
          if (res.saved) {
            vc.setIsManualPriceSetupOpen(false);
            vc.setIsPendingActivation(false);
            if (!isActive) {
              if (vc.operatingEligibility.isEligible) {
                await driverOps.toggleDriverStatus('active');
              } else {
                vc.setIsPackageModalOpen(true);
              }
            }
            if (!driverOps?.activeRequest && state.selectedRequest) {
              dispatch({ type: 'IGNORE_REQUEST', requestId: state.selectedRequest.id });
            }
            dispatch({ type: 'OPEN_RADAR' });
          }
          return res;
        }}
        onClosePriceSetup={vc.handleClosePriceSetup}
        isRatingModalOpen={screen === 'RATING_MODAL'}
        completedTrip={state.completedTrip}
        userUid={user?.uid}
        language={language}
        onDismissRating={() => dispatch({ type: 'RATING_DISMISSED' })}
        isInstallModalOpen={vc.isInstallModalOpen}
        onCloseInstallModal={() => vc.setIsInstallModalOpen(false)}
      />

      <CaptainAdPackageModal
        mounted={true}
        isOpen={vc.isPackageModalOpen}
        isArabic={language === 'ar'}
        radarHourPrice={wallet.radarHourPrice || 300}
        currencySymbol={resolveUserCurrency(user, language)}
        adPackage={vc.adPackage}
        onClose={() => vc.setIsPackageModalOpen(false)}
        onGoToPayment={vc.handleGoToPayment}
        onActivatePackage={vc.handleActivatePackage}
        captainId={user?.uid || ''}
      />

      <CaptainPackageActivatedModal
        isOpen={vc.isPackageSuccessModalOpen}
        isArabic={language === 'ar'}
        onClose={() => vc.setIsPackageSuccessModalOpen(false)}
        onNavigateToLegalRecord={vc.handleNavigateToLegalRecord}
      />

      <CaptainBottomNav
        screen={screen}
        historyUnreadCount={tripUnreadCount}
        hasHistoryUnread={hasTripUnread}
        onSelectTab={(tab) => dispatch({ type: screen === tab ? 'OPEN_RADAR' : (`OPEN_${tab}` as any) })}
      />
    </div>
  );
}
