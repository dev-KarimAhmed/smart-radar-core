'use client';

import React from 'react';
import { Loader2, LogOut, Map, User, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import { ActiveTripTracker } from './driver/active-trip-tracker';
import { BiddingProposalSheet } from './driver/bidding-proposal-sheet';
import {
  captainDashboardReducer,
  initialCaptainDashboardState,
} from './driver/captain-state-machine';
import { DriverProfileTab } from './driver/driver-profile-tab';
import { DriverWalletTab } from './driver/driver-wallet-tab';
import { RadarMapView } from './driver/radar-map-view';

export function DriverViewTab() {
  const { user, logout } = useAuth();
  const { language, direction } = useDashboardLanguage();
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
  };
  const driverOps = useDriverOperations();
  const wallet = useSovereignWallet(user);
  const [state, dispatch] = React.useReducer(captainDashboardReducer, initialCaptainDashboardState);
  const screen = state.screen === 'ACTIVE_TRIP' && !driverOps?.activeRequest ? 'RADAR_MAP' : state.screen;

  React.useEffect(() => {
    if (driverOps?.activeRequest) {
      dispatch({ type: 'SERVER_ACCEPTED', request: driverOps.activeRequest });
    }
  }, [driverOps?.activeRequest]);

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
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {copy.loading}
      </div>
    );
  }

  const isActive = driverOps.driverStatus === 'active' || driverOps.driverStatus === 'busy';
  const paidMinutes = wallet.walletLoaded ? wallet.paidMinutesRemaining : user?.paidHoursRemaining || 0;
  const bonusMinutes = wallet.walletLoaded ? wallet.bonusMinutesRemaining : user?.bonusHoursRemaining || 0;
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
    <div className="min-h-screen bg-[#0B0F19] p-3 pb-10 text-white md:p-5 md:pb-12" dir={direction}>
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4">
        <header className="flex flex-col gap-3 rounded-3xl border border-emerald-500/20 bg-[#05080f] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black text-[#14B8A6]">{copy.badge}</p>
            <h1 className="text-2xl font-black">{copy.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => driverOps.toggleDriverStatus(isActive ? 'idle' : 'active')}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                isActive ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40' : 'bg-slate-800 text-slate-200'
              }`}
            >
              {isActive ? copy.online : copy.offline}
            </button>
            <NavButton active={screen === 'RADAR_MAP' || screen === 'BIDDING'} onClick={() => dispatch({ type: 'OPEN_RADAR' })} label={copy.radar} icon={<Map className="h-4 w-4" />} />
            <NavButton active={screen === 'WALLET'} onClick={() => dispatch({ type: 'OPEN_WALLET' })} label={copy.wallet} icon={<Wallet className="h-4 w-4" />} />
            <NavButton active={screen === 'PROFILE'} onClick={() => dispatch({ type: 'OPEN_PROFILE' })} label={copy.profile} icon={<User className="h-4 w-4" />} />
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-600/15 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-600/25"
            >
              <LogOut className="h-4 w-4" />
              {copy.logout}
            </button>
          </div>
        </header>

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
            onArrived={markArrived}
            onStartTrip={startTrip}
            onCompleteTrip={completeTrip}
          />
        ) : null}

        {screen === 'WALLET' ? <DriverWalletTab user={user} language={language} /> : null}
        {screen === 'PROFILE' ? <DriverProfileTab user={user} language={language} onLogout={logout} /> : null}
      </div>
    </div>
  );
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
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
        active ? 'bg-[#14B8A6] text-[#06111f]' : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
      }`}
    >
      {icon}
      {label}
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
