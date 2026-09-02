'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, History, Languages, Loader2, LogOut, Map, ShieldAlert, User, Wallet, WifiOff } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { Trip } from '@/core/types';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { supabase } from '@/lib/supabase-client';
import { useActiveTripReloadGuard } from '@/shared/hooks/use-active-trip-reload-guard';
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
import { ActiveTripTracker } from './active-trip-tracker';
import { BiddingProposalSheet } from './bidding-proposal-sheet';
import { DriverRatingModal } from './driver-rating-modal';
import { PricePerKmSetupModal } from './price-per-km-setup-modal';
import { MarketStatusIndicator } from './market-status-indicator';
import {
  captainDashboardReducer,
  initialCaptainDashboardState,
  type CaptainTripStep,
} from '../state/captain-state-machine';
import { DriverProfileTab } from './driver-profile-tab';
import { DriverWalletTab } from './driver-wallet-tab';

import { cn } from '@/lib/utils';
const styles = {
  style107_1: "flex min-h-[60vh] items-center justify-center text-slate-400",
  style108_2: "mr-2 h-5 w-5 animate-spin",
  style153_3: "min-h-screen bg-[#0B0F19] p-3 pb-10 text-white md:p-5 md:pb-12",
  style154_4: "mx-auto flex w-full max-w-[1800px] flex-col gap-4",
  style155_5: "flex flex-col gap-3 rounded-3xl border border-emerald-500/20 bg-[#05080f] p-3 sm:p-4",
  style156_1: "flex items-center justify-between gap-2",
  style157_6: "text-[11px] font-black text-[#14B8A6] sm:text-xs",
  style158_7: "text-lg font-black sm:text-2xl",
  style160_8: "flex shrink-0 items-center gap-1.5 sm:gap-2",
  style163_1: "flex flex-wrap items-center gap-1.5 sm:gap-2",
  style164_9: "shrink-0 rounded-2xl px-2.5 py-2.5 text-xs font-black transition sm:px-4 sm:py-3 sm:text-sm",
  style165_10: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40",
  style165_11: "bg-slate-800 text-slate-200",
  style167_1: "grid basis-full grow-0 grid-cols-4 gap-1.5 sm:basis-0 sm:grow sm:gap-2",
  style170_12: "h-4 w-4",
  style171_13: "h-4 w-4",
  style172_14: "h-4 w-4",
  style176_15: "inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-600/15 px-2.5 py-2 text-red-100 transition hover:bg-red-600/25 sm:rounded-2xl sm:px-4 sm:py-3",
  style178_16: "h-4 w-4",
  style186_20: "inline-flex items-center gap-1.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-2 text-[#14F5D5] transition hover:bg-[#14B8A6]/20 sm:rounded-2xl sm:px-4 sm:py-3",
  style186_21: "h-4 w-4",
  style186_22: "hidden text-sm font-black sm:inline",
  style260_17: "inline-flex items-center justify-center gap-1.5 rounded-2xl px-1.5 py-2.5 text-[11px] font-black transition sm:gap-2 sm:px-4 sm:py-3 sm:text-sm",
  style261_18: "bg-[#14B8A6] text-[#06111f]",
  style261_19: "border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10",
  style311_1: "truncate",
  style221_1: "flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100 animate-pulse",
  style222_1: "flex items-center gap-2",
  style223_1: "h-5 w-5 shrink-0 text-amber-300",
  style224_1: "text-sm font-black",
  style225_1: "mt-0.5 text-xs leading-5 text-amber-200/80",
  style226_1: "shrink-0 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs font-black text-amber-100 hover:bg-amber-500/25",
  lockScreenRoot: "flex min-h-screen items-center justify-center bg-[#0B0F19] p-6 text-center text-white",
  lockScreenCard: "max-w-sm space-y-3 rounded-3xl border border-red-500/30 bg-[#170808] p-6",
  lockScreenIcon: "mx-auto h-10 w-10 text-red-400",
  lockScreenTitle: "text-lg font-black text-red-200",
  lockScreenBody: "text-sm leading-6 text-red-100/80",
  connectionBanner: "flex flex-wrap items-center gap-3 rounded-3xl border border-slate-600/50 bg-slate-800/40 p-4 text-slate-200",
  connectionBannerIcon: "h-5 w-5 shrink-0 text-slate-300",
  connectionBannerTitle: "text-sm font-black",
  connectionBannerBody: "mt-0.5 text-xs leading-5 text-slate-300/80",
  style328_1: "flex min-h-[calc(100vh-11rem)] w-full flex-1 flex-col overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#05080f] shadow-2xl shadow-black/30",
} as const;

const RadarMapView = dynamic(() => import('./radar-map-view').then(m => m.RadarMapView), { ssr: false });
const AdStage = dynamic(() => import('@/features/ads/ad-stage/contract').then((m) => m.AdStage), { ssr: false });
const HistoryScreen = dynamic(() => import('@/features/account/history/contract').then((m) => m.HistoryTab), { ssr: false });

export function DriverViewTab() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { language, direction, toggleLanguage } = useDashboardLanguage();
  const t = useTranslations('captainDashboard');
  const driverOps = useDriverOperations();
  const wallet = useSovereignWallet(user);
  const { isTimeTamperingDetected } = useDeviceTimeGuard();
  const { isOffline, isReconnecting } = useConnectionGuard();
  const countryConfig = useCountryConfig(user?.countryId);
  const isDriverLocationLive = driverOps?.driverLocation && (driverOps.driverLocation as { source?: string }).source === 'gps';
  const { currencyCode: liveCurrencyCode, countryCode: liveCountryCode } = useLiveCurrencyFromLocation(
    isDriverLocationLive ? driverOps?.driverLocation : null,
  );
  // If the captain's live GPS country doesn't match the one on their account,
  // the currency they priced themselves in no longer applies — force them to
  // re-confirm/update the price rather than silently keep charging in the
  // wrong currency's numbers.
  const isInDifferentCountry = Boolean(
    liveCountryCode && countryConfig?.iso_code && liveCountryCode.toUpperCase() !== countryConfig.iso_code.toUpperCase(),
  );
  const { needsPriceSetup, isActivationConfirm, currentTariff, saveTariff } = usePricePerKmSetup(
    user,
    isInDifferentCountry,
    driverOps?.activationNonce ?? 0,
  );
  const { marketIndicator } = useCaptainMarketIndicator(user);
  const [state, dispatch] = React.useReducer(captainDashboardReducer, initialCaptainDashboardState);
  const knownRequestIdsRef = React.useRef<Set<string> | null>(null);
  const screen = state.screen === 'ACTIVE_TRIP' && !driverOps?.activeRequest ? 'RADAR_MAP' : state.screen;
  useActiveTripReloadGuard(screen === 'ACTIVE_TRIP');

  React.useEffect(() => {
    if (!driverOps || !isOffline) return;
    if (driverOps.driverStatus === 'active') void driverOps.toggleDriverStatus('idle');
  }, [driverOps, isOffline]);

  React.useEffect(() => {
    if (!driverOps) return;

    if (driverOps.activeRequest) {
      const syncedStep = getCaptainTripStepFromStatus(driverOps.activeRequest.status);
      if (
        state.screen === 'ACTIVE_TRIP'
        && state.selectedRequest?.id === driverOps.activeRequest.id
      ) {
        if (state.tripStep !== syncedStep) {
          dispatch({ type: 'SERVER_ACCEPTED', request: driverOps.activeRequest, step: syncedStep });
        }
        return;
      }
      dispatch({ type: 'SERVER_ACCEPTED', request: driverOps.activeRequest, step: syncedStep });
      return;
    }

    if (state.screen === 'ACTIVE_TRIP') {
      dispatch({ type: 'TRIP_COMPLETED' });
    }
  }, [driverOps, driverOps?.activeRequest, state.screen, state.selectedRequest?.id, state.tripStep]);

  // The captain can sit on the bidding sheet for a while deciding a price. If the rider
  // cancels or the request expires in the meantime, nothing was watching it — the captain
  // could still submit an offer against a dead request and only find out from a generic
  // error. `ride_requests` itself can't be read here (RLS only allows the accepted captain
  // or the rider), so this polls the same `captain_radar_requests` view the whole radar
  // reads through, which only ever lists rows still PENDING — exactly like the
  // already-submitted-offer watcher in use-driver-transactions.ts.
  React.useEffect(() => {
    if (state.screen !== 'BIDDING' || !state.selectedRequest?.id) return;
    const requestId = state.selectedRequest.id;
    let isCancelled = false;

    const checkStillPending = async () => {
      const { data, error } = await supabase
        .from('captain_radar_requests')
        .select('id')
        .eq('id', requestId)
        .maybeSingle();

      if (isCancelled || error || data) return;
      toast({
        title: t('requestNoLongerAvailableTitle'),
        description: t('requestNoLongerAvailableBody'),
      });
      dispatch({ type: 'IGNORE_REQUEST', requestId });
    };

    const intervalId = window.setInterval(() => void checkStillPending(), 5_000);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [state.screen, state.selectedRequest?.id, toast, t]);

  React.useEffect(() => {
    if (!driverOps) return;

    const nextIds = new Set(driverOps.requests.map((request) => request.id));
    const previousIds = knownRequestIdsRef.current;

    if (!previousIds) {
      knownRequestIdsRef.current = nextIds;
      if (nextIds.size > 0 && driverOps.driverStatus === 'active') {
        toast({
          title: t('nearbyRequestsToastTitle'),
          description: t('nearbyRequestsToastBody'),
        });
      }
      return;
    }

    const hasNewRequest = [...nextIds].some((id) => !previousIds.has(id));
    knownRequestIdsRef.current = nextIds;

    if (!hasNewRequest || driverOps.driverStatus !== 'active') return;

    toast({
      title: t('newRequestToastTitle'),
      description: t('newRequestToastBody'),
    });
  }, [driverOps, driverOps?.driverStatus, driverOps?.requests, t, toast]);

  React.useEffect(() => {
    const handleOpen = () => dispatch({ type: 'OPEN_RADAR' });
    window.addEventListener('open-captain-dashboard', handleOpen);
    return () => window.removeEventListener('open-captain-dashboard', handleOpen);
  }, []);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [screen]);

  if (!driverOps) {
    return (
      <div className={styles.style107_1}>
        <Loader2 className={styles.style108_2} />
        {t('loading')}
      </div>
    );
  }

  if (isTimeTamperingDetected) {
    return (
      <div className={styles.lockScreenRoot} dir={direction}>
        <div className={styles.lockScreenCard}>
          <ShieldAlert className={styles.lockScreenIcon} />
          <h1 className={styles.lockScreenTitle}>{t('timeTamperingTitle')}</h1>
          <p className={styles.lockScreenBody}>{t('timeTamperingBody')}</p>
        </div>
      </div>
    );
  }

  const isActive = driverOps.driverStatus === 'active' || driverOps.driverStatus === 'busy';
  const walletIsReady = wallet.walletLoadState === 'ready';
  const paidMinutes = walletIsReady ? wallet.paidMinutesRemaining : 0;
  const bonusMinutes = walletIsReady ? wallet.bonusMinutesRemaining : 0;
  const currency = liveCurrencyCode || getCurrencyLabel(countryConfig, user, language);

  const submitBid = async (price: number, waitSeconds: number) => {
    if (!state.selectedRequest) return;
    const ok = await driverOps.submitOffer({ tripId: state.selectedRequest.id, offerPrice: price, waitSeconds });
    if (ok) dispatch({ type: 'OFFER_SUBMITTED', requestId: state.selectedRequest.id });
  };

  // Spec 5.1.3 "one active offer" — block opening a second request's bidding
  // sheet while an earlier offer is still awaiting the rider's response.
  const selectRequest = (request: Trip) => {
    if (driverOps.pendingOfferRequestId && driverOps.pendingOfferRequestId !== request.id) {
      toast({
        variant: 'destructive',
        title: t('pendingOfferToastTitle'),
        description: t('pendingOfferToastBody'),
      });
      return;
    }
    dispatch({ type: 'SELECT_REQUEST', request });
  };

  const markArrived = async () => {
    const ok = await driverOps.markArrivedAtPickup();
    if (ok) dispatch({ type: 'CONFIRM_ARRIVAL' });
  };

  const startTrip = async () => {
    const ok = await driverOps.startTrip();
    if (ok) dispatch({ type: 'START_TRIP' });
  };

  const completeTrip = async () => {
    // Captured before the RPC call — a successful endTrip() clears
    // driverOps.activeRequest/acceptedRider, so the rider's id/name would
    // otherwise be gone by the time we need them for the rating modal.
    const trip = driverOps.activeRequest;
    const riderName = driverOps.acceptedRider?.name;
    const ok = await driverOps.endTrip();
    if (!ok) return;
    dispatch({
      type: 'TRIP_COMPLETED',
      completedTrip: trip ? { requestId: trip.id, riderId: trip.riderId, riderName } : undefined,
    });
  };

  const cancelTrip = async () => {
    await driverOps.cancelActiveTrip();
  };

  return (
    <div className={styles.style153_3} dir={direction}>
      <div className={styles.style154_4}>
        <header className={styles.style155_5}>
          <div className={styles.style156_1}>
            <div>
              <p className={styles.style157_6}>{t('badge')}</p>
              <h1 className={styles.style158_7}>{t('title')}</h1>
            </div>
            <div className={styles.style160_8}>
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={t('switchLanguageAria')}
                title={t('switchLanguageLabel')}
                className={styles.style186_20}
              >
                <Languages className={styles.style186_21} />
                <span className={styles.style186_22}>{t('switchLanguageLabel')}</span>
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                aria-label={t('logout')}
                title={t('logout')}
                className={styles.style176_15}
              >
                <LogOut className={styles.style178_16} />
                <span className={styles.style186_22}>{t('logout')}</span>
              </button>
            </div>
          </div>
          <div className={styles.style163_1}>
            <button
              type="button"
              onClick={() => void driverOps.toggleDriverStatus(isActive ? 'idle' : 'active')}
              disabled={isOffline || isReconnecting || driverOps.isUpdatingStatus}
              className={cn(styles.style164_9, isActive ? styles.style165_10 : styles.style165_11)}
            >
              {driverOps.isUpdatingStatus ? t('statusUpdating') : isActive ? t('online') : t('offline')}
            </button>
            <MarketStatusIndicator indicator={marketIndicator} size="compact" />
            <div className={styles.style167_1}>
              <NavButton active={screen === 'RADAR_MAP' || screen === 'BIDDING'} onClick={() => dispatch({ type: 'OPEN_RADAR' })} label={t('radar')} icon={<Map className={styles.style170_12} />} />
              <NavButton active={screen === 'WALLET'} onClick={() => dispatch({ type: 'OPEN_WALLET' })} label={t('wallet')} icon={<Wallet className={styles.style171_13} />} />
              <NavButton active={screen === 'HISTORY'} onClick={() => dispatch({ type: 'OPEN_HISTORY' })} label={t('history')} icon={<History className={styles.style172_14} />} />
              <NavButton active={screen === 'PROFILE'} onClick={() => dispatch({ type: 'OPEN_PROFILE' })} label={t('profile')} icon={<User className={styles.style172_14} />} />
            </div>
          </div>
        </header>

        {driverOps.isDormancyWarningVisible ? (
          <div className={styles.style221_1}>
            <div className={styles.style222_1}>
              <AlertTriangle className={styles.style223_1} />
              <div>
                <p className={styles.style224_1}>{t('dormancyWarningTitle')}</p>
                <p className={styles.style225_1}>{t('dormancyWarningBody')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => driverOps.resetDormancyTimer()}
              className={styles.style226_1}
            >
              {t('dormancyWarningButton')}
            </button>
          </div>
        ) : null}

        {isOffline || isReconnecting ? (
          <div className={styles.connectionBanner}>
            <WifiOff className={styles.connectionBannerIcon} />
            <div>
              <p className={styles.connectionBannerTitle}>{isOffline ? t('offlineBannerTitle') : t('reconnectingTitle')}</p>
              <p className={styles.connectionBannerBody}>{isOffline ? t('offlineBannerBody') : t('reconnectingBody')}</p>
            </div>
          </div>
        ) : null}

        {screen === 'RADAR_MAP' && !isActive ? (
          <div className={styles.style328_1}>
            <AdStage audience="captain" isFullScreen />
          </div>
        ) : null}

        {screen === 'RADAR_MAP' && isActive ? (
          <RadarMapView
            language={language}
            isActive={isActive}
            driverLocation={driverOps.driverLocation}
            currentH3Cell={driverOps.currentH3Cell}
            paidMinutes={paidMinutes}
            bonusMinutes={bonusMinutes}
            radarLockMessage={driverOps.radarLockMessage}
            requests={driverOps.requests}
            pendingOfferRequestId={driverOps.pendingOfferRequestId}
            onSelectRequest={selectRequest}
            onIgnoreRequest={driverOps.rejectRequest}
          />
        ) : null}

        {screen === 'BIDDING' && state.selectedRequest ? (
          <BiddingProposalSheet
            language={language}
            request={state.selectedRequest}
            currency={currency}
            driverLocation={driverOps.driverLocation}
            isSubmitting={driverOps.isSubmittingOffer}
            onSubmit={submitBid}
            onIgnore={() => {
              if (state.selectedRequest) driverOps.rejectRequest(state.selectedRequest.id);
              dispatch({ type: 'IGNORE_REQUEST', requestId: state.selectedRequest?.id || '' });
            }}
          />
        ) : null}

        {screen === 'ACTIVE_TRIP' && driverOps.activeRequest ? (
          <ActiveTripTracker
            language={language}
            request={driverOps.activeRequest}
            rider={driverOps.acceptedRider}
            step={state.tripStep}
            isCompleting={driverOps.isEndingTrip || driverOps.isUpdatingTripStep}
            isCancelling={driverOps.isCancellingTrip}
            currency={currency}
            driverLocation={driverOps.driverLocation}
            handshakeAt={driverOps.handshakeAt}
            onArrived={markArrived}
            onStartTrip={startTrip}
            onCompleteTrip={completeTrip}
            onCancelTrip={() => void cancelTrip()}
          />
        ) : null}

        {screen === 'WALLET' ? <DriverWalletTab user={user} language={language} isFlightActive={isActive} /> : null}
        {screen === 'HISTORY' ? <HistoryScreen hideCaptainDiagnostics /> : null}
        {screen === 'PROFILE' ? <DriverProfileTab user={user} language={language} /> : null}
      </div>

      {needsPriceSetup ? (
        <PricePerKmSetupModal
          // A fresh activation gets a fresh form: the modal seeds its inputs from
          // initialTariff on mount only, so without this a remount-less re-open would keep
          // whatever was typed last time instead of the stored tariff.
          key={driverOps?.activationNonce ?? 0}
          direction={direction}
          currency={currency}
          minBaseFare={currentTariff.minBaseFare}
          minBaseFareSource={currentTariff.minBaseFareSource}
          marketAverage={currentTariff.marketAverage}
          marketIndicator={marketIndicator}
          initialTariff={currentTariff}
          isCountryChange={currentTariff.pricePerKm !== null && isInDifferentCountry}
          isActivationConfirm={isActivationConfirm}
          onSave={saveTariff}
        />
      ) : null}

      {screen === 'RATING_MODAL' && state.completedTrip && user?.uid ? (
        <DriverRatingModal
          isOpen={true}
          onClose={() => dispatch({ type: 'RATING_DISMISSED' })}
          language={language}
          tripId={state.completedTrip.requestId}
          riderId={state.completedTrip.riderId}
          captainId={user.uid}
          supabase={supabase}
          riderName={state.completedTrip.riderName}
          onSuccess={() => dispatch({ type: 'RATING_DISMISSED' })}
        />
      ) : null}
    </div>
  );
}

function getCaptainTripStepFromStatus(status: unknown): CaptainTripStep {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'ARRIVED') return 'ARRIVED';
  if (normalized === 'TRIP_ACTIVE' || normalized === 'ACTIVE' || normalized === 'STARTED' || normalized === 'IN_PROGRESS') {
    return 'STARTED';
  }
  if (normalized === 'COMPLETED') return 'COMPLETED';

  return 'ACCEPTED';
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(styles.style260_17, active ? styles.style261_18 : styles.style261_19)}
    >
      {icon}
      <span className={styles.style311_1}>{label}</span>
    </button>
  );
}
