import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Offer } from '@/core/types';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { acceptRideOffer } from '../services/rider-server-marketplace';
import { getLocalizedMarketplaceError } from '../services/rider-offer-presentation';
import type { RiderMachineAction } from '../state/rider-state-machine';

interface UseOfferAcceptanceParams {
  requestId?: string | null;
  language: AppLanguage;
  dispatch: React.Dispatch<RiderMachineAction>;
  refreshOffers: () => Promise<void>;
  toast: any;
  t: any;
}

export function useOfferAcceptance({
  requestId,
  language,
  dispatch,
  refreshOffers,
  toast,
  t,
}: UseOfferAcceptanceParams) {
  const [acceptingOfferId, setAcceptingOfferId] = React.useState<string | null>(null);

  const handleAcceptOffer = React.useCallback(async (offer: Offer) => {
    if (!requestId) {
      toast({
        variant: 'destructive',
        title: t('offers.acceptNoActiveTitle'),
        description: t('offers.acceptNoActiveDescription'),
      });
      return;
    }

    const offerId = offer.id || (offer as any).offer_id || (offer as any).offerId;
    if (!offerId) {
      toast({
        variant: 'destructive',
        title: t('offers.acceptIncompleteTitle'),
        description: t('offers.acceptIncompleteDescription'),
      });
      return;
    }

    setAcceptingOfferId(offerId);

    try {
      const result = await acceptRideOffer(supabase, {
        requestId,
        offerId,
      });
      dispatch({ type: 'SELECT_OFFER', offerId });

      if (result) {
        dispatch({
          type: 'SERVER_STATUS_ACCEPTED',
          row: {
            id: requestId,
            status: result.status || 'ACCEPTED',
            accepted_offer_id: offerId,
            selected_offer_id: offerId,
            accepted_captain_id: result.captain_id || offer.driverId,
            final_fare: result.final_fare || offer.price,
            accepted_at: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Rider Accept Offer]', error);
      void refreshOffers();
      toast({
        variant: 'destructive',
        title: t('offers.acceptFailedTitle'),
        description: getLocalizedMarketplaceError(error, language, {
          permissionDenied: t('errors.permissionDenied'),
          authRequired: t('errors.authRequired'),
          network: t('errors.network'),
          fareCalculation: t('errors.fareCalculation'),
          missingColumns: t('errors.missingColumns'),
          invalidStatus: t('errors.invalidStatus'),
          foreignKeyMismatch: t('errors.foreignKeyMismatch'),
          duplicateActive: t('errors.duplicateActive'),
          generic: t('errors.generic'),
        }),
      });
    } finally {
      setAcceptingOfferId(null);
    }
  }, [dispatch, language, refreshOffers, requestId, t, toast]);

  return {
    acceptingOfferId,
    setAcceptingOfferId,
    handleAcceptOffer,
  };
}
