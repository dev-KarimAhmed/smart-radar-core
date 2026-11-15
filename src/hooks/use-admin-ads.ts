'use client';

import { useAdminAdsData } from './admin-ads/use-admin-ads-data';
import { useAdminAdsMutations } from './admin-ads/use-admin-ads-mutations';
import { useAdminAdsLifecycle } from './admin-ads/use-admin-ads-lifecycle';
import { useAdminAdsModeration } from './admin-ads/use-admin-ads-moderation';
import { SovereignAd, AdInput } from './admin-ads/admin-ads-types';

export type { SovereignAd, AdInput };

export function useAdminAds() {
  const { ads, localPromos, dbPromos, isLoading, updateLocalPromos } = useAdminAdsData();

  const {
    isProcessing,
    isProcessingRef,
    setIsProcessing,
    createAd,
    executeAdAnnihilation,
  } = useAdminAdsMutations({
    localPromos,
    dbPromos,
    updateLocalPromos,
  });

  const {
    toggleAdStatus,
    deleteAd,
    freezeAd,
    extendAd,
  } = useAdminAdsLifecycle({
    ads,
    localPromos,
    dbPromos,
    updateLocalPromos,
    isProcessingRef,
    setIsProcessing,
  });

  const {
    approveAd,
    rejectAd,
  } = useAdminAdsModeration({
    localPromos,
    dbPromos,
    updateLocalPromos,
    isProcessingRef,
    setIsProcessing,
  });

  return {
    ads,
    isLoading,
    isProcessing,
    createAd,
    toggleAdStatus,
    deleteAd,
    freezeAd,
    extendAd,
    approveAd,
    rejectAd,
    executeAdAnnihilation,
  };
}
