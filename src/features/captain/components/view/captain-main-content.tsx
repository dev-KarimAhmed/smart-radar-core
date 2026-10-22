'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { Trip, User } from '@/core/types';
import type { CaptainTripStep } from '../../state/captain-state-machine';
import { CaptainActiveTripOverlay } from '../captain-active-trip-overlay';
import { BiddingProposalSheet } from '../bidding-proposal-sheet';
import { CaptainReturnHomeBar } from './captain-return-home-bar';
import { DriverWalletTab } from '../driver-wallet-tab';
import { DriverProfileTab } from '../driver-profile-tab';

const styles = {
  contentRoot: 'contents',
  adStageWrap: 'flex min-h-[calc(100vh-11rem)] w-full flex-1 flex-col overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#05080f] shadow-2xl shadow-black/30',
  notificationsWrap: 'flex-1 rounded-3xl border border-emerald-500/20 bg-[#05080f] p-3 sm:p-6 shadow-2xl',
} as const;

const RadarMapView = dynamic(() => import('../radar-map-view').then((m) => m.RadarMapView), { ssr: false });
const AdStage = dynamic(() => import('@/features/ads/ad-stage/contract').then((m) => m.AdStage), { ssr: false });
const HistoryScreen = dynamic(() => import('@/features/account/history/contract').then((m) => m.HistoryTab), { ssr: false });
const NotificationsScreen = dynamic(
  () => import('@/features/account/components/notifications-tab').then((m) => m.NotificationsTab),
  { ssr: false },
);

export interface CaptainMainContentProps {
  screen: string;
  direction: string;
  language: string;
  isActive: boolean;
  isOffline: boolean;
  isReconnecting: boolean;
  user: User | null;
  driverOps: any;
  currency: string;
  paidMinutes: number;
  bonusMinutes: number;
  tripStep: CaptainTripStep;
  selectedRequest: Trip | null;
  currentTariff: any;
  onOpenRadar: () => void;
  onConfirmArrival: () => void;
  onStartTrip: () => void;
  onCompleteTrip: () => void;
  onSelectRequest: (request: Trip, initialPrice?: string | number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => void;
  onSubmitDirectBid: (request: Trip, price: number, waitSeconds?: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => Promise<void>;
  onSubmitBid: (price: number, waitSeconds: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => Promise<void>;
  onOpenPriceSetup: () => void;
  dispatch: (action: any) => void;
}

export function CaptainMainContent({
  screen,
  direction,
  language,
  isActive,
  isOffline,
  isReconnecting,
  user,
  driverOps,
  currency,
  paidMinutes,
  bonusMinutes,
  tripStep,
  selectedRequest,
  currentTariff,
  onOpenRadar,
  onConfirmArrival,
  onStartTrip,
  onCompleteTrip,
  onSelectRequest,
  onSubmitDirectBid,
  onSubmitBid,
  onOpenPriceSetup,
  dispatch,
}: CaptainMainContentProps) {
  return (
    <div className={styles.contentRoot}>
      {screen === 'ACTIVE_TRIP' && driverOps.activeRequest ? (
        <CaptainActiveTripOverlay
          direction={direction}
          language={language === 'en' ? 'en' : 'ar'}
          isOffline={isOffline}
          isReconnecting={isReconnecting}
          activeRequest={driverOps.activeRequest}
          acceptedRider={driverOps.acceptedRider}
          step={tripStep}
          currency={currency}
          driverLocation={driverOps.driverLocation}
          handshakeAt={driverOps.handshakeAt}
          isCompleting={driverOps.isEndingTrip || driverOps.isUpdatingTripStep}
          isCancelling={driverOps.isCancellingTrip}
          onArrived={onConfirmArrival}
          onStartTrip={onStartTrip}
          onCompleteTrip={onCompleteTrip}
          onCancelTrip={() => { void driverOps.cancelActiveTrip(); }}
        />
      ) : null}

      {screen === 'RADAR_MAP' && !driverOps.activeRequest && !isActive ? (
        <div className={styles.adStageWrap}>
          <AdStage audience="captain" isFullScreen />
        </div>
      ) : null}

      {screen === 'RADAR_MAP' && !driverOps.activeRequest && isActive ? (
        <RadarMapView
          language={language === 'en' ? 'en' : 'ar'}
          isActive={isActive}
          driverLocation={driverOps.driverLocation}
          currentH3Cell={driverOps.currentH3Cell}
          paidMinutes={paidMinutes}
          bonusMinutes={bonusMinutes}
          currency={currency}
          radarLockMessage={driverOps.radarLockMessage}
          cancelCooldown={driverOps.cancelCooldown}
          requests={driverOps.requests}
          pendingOfferRequestId={driverOps.pendingOfferRequestId}
          captainPricingMode={currentTariff?.pricingMode ?? null}
          currentTariff={currentTariff}
          isOfficeTaxi={user?.affiliation?.type === 'office-taxi'}
          subRole={user?.subRole}
          onSelectRequest={onSelectRequest}
          onIgnoreRequest={driverOps.rejectRequest}
          onSubmitDirectBid={onSubmitDirectBid}
          onEditTariff={onOpenPriceSetup}
        />
      ) : null}

      {screen === 'BIDDING' && selectedRequest ? (
        <BiddingProposalSheet
          language={language === 'en' ? 'en' : 'ar'}
          request={selectedRequest}
          currency={currency}
          driverLocation={driverOps.driverLocation}
          isSubmitting={driverOps.isSubmittingOffer}
          currentTariff={currentTariff}
          onEditTariff={onOpenPriceSetup}
          onSubmit={onSubmitBid}
          onIgnore={() => {
            driverOps.rejectRequest(selectedRequest.id);
            dispatch({ type: 'IGNORE_REQUEST', requestId: selectedRequest.id });
          }}
        />
      ) : null}

      <CaptainReturnHomeBar screen={screen} onReturnHome={onOpenRadar} />

      {screen === 'WALLET' ? <DriverWalletTab user={user} language={language === 'en' ? 'en' : 'ar'} isFlightActive={isActive} /> : null}

      {screen === 'NOTIFICATIONS' ? (
        <div className={styles.notificationsWrap}>
          <NotificationsScreen onClose={onOpenRadar} />
        </div>
      ) : null}

      {screen === 'HISTORY' ? <HistoryScreen hideCaptainDiagnostics /> : null}

      {screen === 'PROFILE' ? <DriverProfileTab user={user} language={language === 'en' ? 'en' : 'ar'} /> : null}
    </div>
  );
}
