'use client';

import React from 'react';
import { AlertTriangle, Languages, Loader2, LogOut, Map, User, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useDriverOperations } from '../hooks/use-driver-operations';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import { useToast } from '@/hooks/use-toast';
import { ActiveTripTracker } from './active-trip-tracker';
import { BiddingProposalSheet } from './bidding-proposal-sheet';
import {
  captainDashboardReducer,
  initialCaptainDashboardState,
  type CaptainTripStep,
} from '../state/captain-state-machine';
import { DriverProfileTab } from './driver-profile-tab';
import { DriverWalletTab } from './driver-wallet-tab';
import dynamic from 'next/dynamic';

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
  style163_1: "flex items-center gap-1.5 sm:gap-2",
  style164_9: "shrink-0 rounded-2xl px-2.5 py-2.5 text-xs font-black transition sm:px-4 sm:py-3 sm:text-sm",
  style165_10: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40",
  style165_11: "bg-slate-800 text-slate-200",
  style167_1: "grid flex-1 grid-cols-3 gap-1.5 sm:gap-2",
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
} as const;

const RadarMapView = dynamic(() => import('./radar-map-view').then(m => m.RadarMapView), { ssr: false });

export function DriverViewTab() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { language, direction, toggleLanguage } = useDashboardLanguage();
  const copy = {
    ...driverCopy[language],
    loading: language === 'ar' ? 'جاري تحميل لوحة الكابتن...' : 'Loading captain dashboard...',
    badge: language === 'ar' ? 'لوحة الكابتن' : 'Captain dashboard',
    title: language === 'ar' ? 'الطلبات والرحلات' : 'Requests and trips',
    online: language === 'ar' ? 'متاح' : 'Online',
    offline: language === 'ar' ? 'غير متاح' : 'Offline',
    radar: language === 'ar' ? 'الرادار' : 'Radar',
    wallet: language === 'ar' ? 'الرصيد' : 'Wallet',
    profile: language === 'ar' ? 'حسابي' : 'Profile',
    logout: language === 'ar' ? 'تسجيل الخروج' : 'Log out',
    switchLanguageLabel: language === 'ar' ? 'English' : 'العربية',
    switchLanguageAria: language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية',
    dormancyWarningTitle: language === 'ar' ? 'أنت على وشك الخروج من صالة المزاد' : "You're about to be pulled off the auction floor",
    dormancyWarningBody: language === 'ar'
      ? 'لم يُسجَّل أي تفاعل منك منذ 9 دقائق. بعد دقيقة إضافية سيتم إيقاف استقبال الطلبات تلقائياً.'
      : 'No activity detected for 9 minutes. In one more minute you will be automatically taken offline.',
    dormancyWarningButton: language === 'ar' ? 'ما زلت هنا' : "I'm still here",
  };
  const driverOps = useDriverOperations();
  const wallet = useSovereignWallet(user);
  const [state, dispatch] = React.useReducer(captainDashboardReducer, initialCaptainDashboardState);
  const knownRequestIdsRef = React.useRef<Set<string> | null>(null);
  const screen = state.screen === 'ACTIVE_TRIP' && !driverOps?.activeRequest ? 'RADAR_MAP' : state.screen;

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

  React.useEffect(() => {
    if (!driverOps) return;

    const nextIds = new Set(driverOps.requests.map((request) => request.id));
    const previousIds = knownRequestIdsRef.current;

    if (!previousIds) {
      knownRequestIdsRef.current = nextIds;
      if (nextIds.size > 0 && driverOps.driverStatus === 'active') {
        toast({
          title: language === 'ar' ? 'طلبات قريبة متاحة' : 'Nearby requests available',
          description: language === 'ar' ? 'افتح قائمة الطلبات لتقديم عرضك.' : 'Open the request queue to submit your bid.',
        });
      }
      return;
    }

    const hasNewRequest = [...nextIds].some((id) => !previousIds.has(id));
    knownRequestIdsRef.current = nextIds;

    if (!hasNewRequest || driverOps.driverStatus !== 'active') return;

    toast({
      title: language === 'ar' ? 'طلب رحلة جديد' : 'New ride request',
      description: language === 'ar' ? 'يوجد طلب قريب بانتظار عرضك.' : 'A nearby request is waiting for your bid.',
    });
  }, [driverOps, driverOps?.driverStatus, driverOps?.requests, language, toast]);

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
        {copy.loading}
      </div>
    );
  }

  const isActive = driverOps.driverStatus === 'active' || driverOps.driverStatus === 'busy';
  const walletIsReady = wallet.walletLoadState === 'ready';
  const paidMinutes = walletIsReady ? wallet.paidMinutesRemaining : 0;
  const bonusMinutes = walletIsReady ? wallet.bonusMinutesRemaining : 0;
  const currency = user?.currencyAr || user?.currencyEn || '';

  const submitBid = async (price: number) => {
    if (!state.selectedRequest) return;
    const ok = await driverOps.submitOffer({ tripId: state.selectedRequest.id, offerPrice: price });
    if (ok) dispatch({ type: 'OFFER_SUBMITTED', requestId: state.selectedRequest.id });
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
    const ok = await driverOps.endTrip();
    if (ok) dispatch({ type: 'TRIP_COMPLETED' });
  };

  return (
    <div className={styles.style153_3} dir={direction}>
      <div className={styles.style154_4}>
        <header className={styles.style155_5}>
          <div className={styles.style156_1}>
            <div>
              <p className={styles.style157_6}>{copy.badge}</p>
              <h1 className={styles.style158_7}>{copy.title}</h1>
            </div>
            <div className={styles.style160_8}>
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={copy.switchLanguageAria}
                title={copy.switchLanguageLabel}
                className={styles.style186_20}
              >
                <Languages className={styles.style186_21} />
                <span className={styles.style186_22}>{copy.switchLanguageLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                aria-label={copy.logout}
                title={copy.logout}
                className={styles.style176_15}
              >
                <LogOut className={styles.style178_16} />
                <span className={styles.style186_22}>{copy.logout}</span>
              </button>
            </div>
          </div>
          <div className={styles.style163_1}>
            <button
              type="button"
              onClick={() => driverOps.toggleDriverStatus(isActive ? 'idle' : 'active')}
              className={cn(styles.style164_9, isActive ? styles.style165_10 : styles.style165_11)}
            >
              {isActive ? copy.online : copy.offline}
            </button>
            <div className={styles.style167_1}>
              <NavButton active={screen === 'RADAR_MAP' || screen === 'BIDDING'} onClick={() => dispatch({ type: 'OPEN_RADAR' })} label={copy.radar} icon={<Map className={styles.style170_12} />} />
              <NavButton active={screen === 'WALLET'} onClick={() => dispatch({ type: 'OPEN_WALLET' })} label={copy.wallet} icon={<Wallet className={styles.style171_13} />} />
              <NavButton active={screen === 'PROFILE'} onClick={() => dispatch({ type: 'OPEN_PROFILE' })} label={copy.profile} icon={<User className={styles.style172_14} />} />
            </div>
          </div>
        </header>

        {driverOps.isDormancyWarningVisible ? (
          <div className={styles.style221_1}>
            <div className={styles.style222_1}>
              <AlertTriangle className={styles.style223_1} />
              <div>
                <p className={styles.style224_1}>{copy.dormancyWarningTitle}</p>
                <p className={styles.style225_1}>{copy.dormancyWarningBody}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => driverOps.resetDormancyTimer()}
              className={styles.style226_1}
            >
              {copy.dormancyWarningButton}
            </button>
          </div>
        ) : null}

        {screen === 'RADAR_MAP' ? (
          <RadarMapView
            language={language}
            isActive={isActive}
            driverLocation={driverOps.driverLocation}
            currentH3Cell={driverOps.currentH3Cell}
            paidMinutes={paidMinutes}
            bonusMinutes={bonusMinutes}
            radarLockMessage={driverOps.radarLockMessage}
            requests={driverOps.requests}
            onSelectRequest={(request) => dispatch({ type: 'SELECT_REQUEST', request })}
            onIgnoreRequest={driverOps.rejectRequest}
          />
        ) : null}

        {screen === 'BIDDING' && state.selectedRequest ? (
          <BiddingProposalSheet
            language={language}
            request={state.selectedRequest}
            currency={currency}
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
            currency={currency}
            driverLocation={driverOps.driverLocation}
            handshakeAt={driverOps.handshakeAt}
            onArrived={markArrived}
            onStartTrip={startTrip}
            onCompleteTrip={completeTrip}
          />
        ) : null}

        {screen === 'WALLET' ? <DriverWalletTab user={user} language={language} isFlightActive={isActive} /> : null}
        {screen === 'PROFILE' ? <DriverProfileTab user={user} language={language} onLogout={logout} /> : null}
      </div>
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

const driverCopy = {
  ar: {
    loading: 'جاري تحميل لوحة الكابتن...',
    badge: 'لوحة الكابتن',
    title: 'إدارة الطلبات والرحلات',
    online: 'متاح',
    offline: 'غير متاح',
    radar: 'الرادار',
    wallet: 'الرصيد',
    profile: 'الملف',
  },
  en: {
    loading: 'Loading captain dashboard...',
    badge: 'Captain dashboard',
    title: 'Requests and trips',
    online: 'Online',
    offline: 'Offline',
    radar: 'Radar',
    wallet: 'Wallet',
    profile: 'Profile',
  },
} as const;
