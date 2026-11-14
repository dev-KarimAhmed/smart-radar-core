'use client';

import { useMemo, useRef } from 'react';
import type { Trip, User } from '@/core/types';
import {
  MIN_OFFER_WAIT_SECONDS,
  DEFAULT_OFFER_WAIT_SECONDS,
  MAX_OFFER_WAIT_SECONDS,
} from '../services/driver-transactions-mapper';
import { useDriverBidding } from './transactions/use-driver-bidding';
import { useDriverTripSync } from './transactions/use-driver-trip-sync';
import { useDriverTripLifecycle } from './transactions/use-driver-trip-lifecycle';
import { useDriverReports } from './transactions/use-driver-reports';

export {
  MIN_OFFER_WAIT_SECONDS,
  DEFAULT_OFFER_WAIT_SECONDS,
  MAX_OFFER_WAIT_SECONDS,
};

export function useDriverTransactions(
  user: User | null,
  setDriverStatus?: (status: 'active' | 'idle' | 'busy' | 'rating') => void,
  driverStatus?: string,
) {
  const captainId = user?.uid || '';
  const activeReqRef = useRef<Trip | null>(null);

  // 1. Bidding & Offer Management
  const bidding = useDriverBidding({
    captainId,
    activeReqRef,
  });

  // 2. Realtime Trip Sync & Reconcile
  const sync = useDriverTripSync({
    captainId,
    driverStatus,
    setDriverStatus,
    pendingOffersCount: bidding.pendingOffersCount,
    clearPendingOffer: bidding.clearPendingOffer,
    activeReqRef,
  });

  // 3. Trip Lifecycle & Milestones
  const lifecycle = useDriverTripLifecycle({
    activeRequest: sync.activeRequest,
    activeReqRef,
    captainId,
    acceptedRider: sync.acceptedRider,
    selfCancelledTripId: sync.selfCancelledTripId,
    cleanUpAndReset: sync.cleanUpAndReset,
    applyCancellationCooldownFromRequest: sync.applyCancellationCooldownFromRequest,
    loadAcceptedRequest: sync.loadAcceptedRequest,
  });

  // 4. Weekly Reports
  const reports = useDriverReports();

  return useMemo(() => ({
    activeRequest: sync.activeRequest,
    acceptedRider: sync.acceptedRider,
    handshakeAt: sync.handshakeAt,
    pendingOfferRequestId: bidding.pendingOfferRequestId,
    pendingOffersCount: bidding.pendingOffersCount,
    submitOffer: bidding.submitOffer,
    isSubmittingOffer: bidding.isSubmittingOffer,
    cancelOffer: bidding.cancelOffer,
    isCancellingOffer: bidding.isCancellingOffer,
    markArrivedAtPickup: lifecycle.markArrivedAtPickup,
    startTrip: lifecycle.startTrip,
    isUpdatingTripStep: lifecycle.isUpdatingTripStep,
    endTrip: lifecycle.endTrip,
    isEndingTrip: lifecycle.isEndingTrip,
    cancelActiveTrip: lifecycle.cancelActiveTrip,
    acknowledgeMutualCancel: lifecycle.acknowledgeMutualCancel,
    isCancellingTrip: lifecycle.isCancellingTrip,
    rateAndFinishTrip: lifecycle.rateAndFinishTrip,
    isRatingRider: lifecycle.isRatingRider,
    requestWeeklyReport: reports.requestWeeklyReport,
    isRequestingReport: reports.isRequestingReport,
  }), [
    bidding.cancelOffer,
    bidding.isCancellingOffer,
    bidding.isSubmittingOffer,
    bidding.pendingOfferRequestId,
    bidding.pendingOffersCount,
    bidding.submitOffer,
    lifecycle.acknowledgeMutualCancel,
    lifecycle.cancelActiveTrip,
    lifecycle.endTrip,
    lifecycle.isCancellingTrip,
    lifecycle.isEndingTrip,
    lifecycle.isRatingRider,
    lifecycle.isUpdatingTripStep,
    lifecycle.markArrivedAtPickup,
    lifecycle.rateAndFinishTrip,
    lifecycle.startTrip,
    reports.isRequestingReport,
    reports.requestWeeklyReport,
    sync.acceptedRider,
    sync.activeRequest,
    sync.handshakeAt,
  ]);
}
