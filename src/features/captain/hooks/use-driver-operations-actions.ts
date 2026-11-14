import { useCallback } from 'react';

interface RawTransactionActions {
  rawSubmitOffer: (payload: { tripId: string; offerPrice: number; waitSeconds: number; pricingMode?: 'FREE' | 'APP' | 'TAXI' }) => Promise<boolean>;
  rawCancelOffer: (tripId?: string) => Promise<boolean>;
  rawMarkArrivedAtPickup: () => Promise<boolean>;
  rawStartTrip: () => Promise<boolean>;
  rawEndTrip: () => Promise<boolean>;
  rawCancelActiveTrip: () => Promise<boolean>;
  rawAcknowledgeMutualCancel: () => void;
  rawRateAndFinishTrip: () => Promise<void>;
  rawRequestWeeklyReport: () => Promise<void>;
  rawRejectRequest: (tripId: string) => void;
}

export function useDriverOperationsActions({
  rawSubmitOffer,
  rawCancelOffer,
  rawMarkArrivedAtPickup,
  rawStartTrip,
  rawEndTrip,
  rawCancelActiveTrip,
  rawAcknowledgeMutualCancel,
  rawRateAndFinishTrip,
  rawRequestWeeklyReport,
  rawRejectRequest,
}: RawTransactionActions) {
  const rejectRequest = useCallback((tripId: string) => {
    rawRejectRequest(tripId);
  }, [rawRejectRequest]);

  const submitOffer = useCallback(async (payload: { tripId: string; offerPrice: number; waitSeconds: number; pricingMode?: 'FREE' | 'APP' | 'TAXI' }) => {
    return rawSubmitOffer(payload);
  }, [rawSubmitOffer]);

  const cancelOffer = useCallback(async (tripId?: string) => {
    return rawCancelOffer(tripId);
  }, [rawCancelOffer]);

  const markArrivedAtPickup = useCallback(async () => {
    return rawMarkArrivedAtPickup();
  }, [rawMarkArrivedAtPickup]);

  const startTrip = useCallback(async () => {
    return rawStartTrip();
  }, [rawStartTrip]);

  const endTrip = useCallback(async () => {
    return rawEndTrip();
  }, [rawEndTrip]);

  const cancelActiveTrip = useCallback(async () => {
    return rawCancelActiveTrip();
  }, [rawCancelActiveTrip]);

  const acknowledgeMutualCancel = useCallback(() => {
    rawAcknowledgeMutualCancel();
  }, [rawAcknowledgeMutualCancel]);

  const rateAndFinishTrip = useCallback(async () => {
    await rawRateAndFinishTrip();
  }, [rawRateAndFinishTrip]);

  const requestWeeklyReport = useCallback(async () => {
    await rawRequestWeeklyReport();
  }, [rawRequestWeeklyReport]);

  return {
    rejectRequest,
    submitOffer,
    cancelOffer,
    markArrivedAtPickup,
    startTrip,
    endTrip,
    cancelActiveTrip,
    acknowledgeMutualCancel,
    rateAndFinishTrip,
    requestWeeklyReport,
  };
}
