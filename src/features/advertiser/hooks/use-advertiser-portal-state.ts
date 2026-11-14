'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { useMarketPulse } from '@/hooks/use-market-pulse';
import { useToast } from '@/hooks/use-toast';
import { useAdvertiserCampaignForm } from './use-advertiser-campaign-form';
import { useAdvertiserAuditSimulation } from './use-advertiser-audit-simulation';

export function useAdvertiserPortalState() {
  const { createAd, ads, toggleAdStatus, deleteAd, extendAd } = useAdminAds();
  const { pulseData } = useMarketPulse(true);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'create'>('dashboard');
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
  const [advertiserBalance, setAdvertiserBalance] = useState(150.0);

  const pendingAds = useMemo(() => {
    return (ads || []).filter(
      ad => (ad.status || '').toLowerCase() === 'pending' || (ad.status || '') === 'PENDING'
    );
  }, [ads]);

  const form = useAdvertiserCampaignForm(pulseData);

  const audit = useAdvertiserAuditSimulation({
    posterUrl: form.posterUrl,
    whatsapp: form.whatsapp,
    phone: form.phone,
    geoLoc: form.geoLoc,
    governorate: form.governorate,
    district: form.district,
    title: form.title,
    description: form.description,
    buttonText: form.buttonText,
    targetImpressions: form.targetImpressions,
    advertiserBalance,
    calculatedCost: form.calculatedCost,
    selectedPackageId: form.selectedPackageId,
    isPremiumRetentionPaid: form.isPremiumRetentionPaid,
    checkDistrictCapacity: form.checkDistrictCapacity,
    createAd,
    setStep: form.setStep,
    setAdvertiserBalance,
  });

  const ledgerStats = useMemo(() => {
    let totalImpressions = 0;
    let totalClicks = 0;
    ads.forEach(ad => {
      if (ad.status === 'active') {
        totalImpressions += (ad.currentImpressions || 0);
        totalClicks += (ad.clicksCount || 0);
      }
    });

    const finalImpressions = totalImpressions || 16480;
    const finalClicks = totalClicks || 912;
    const ctr = finalImpressions > 0 ? ((finalClicks / finalImpressions) * 100).toFixed(2) : '5.53';

    let localHeartsCount = 0;
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('sovereign_hearted_ads');
        if (stored) {
          localHeartsCount = JSON.parse(stored).length;
        }
      }
    } catch {
      // silent
    }
    const followerPulse = localHeartsCount || 350;

    return {
      impressions: finalImpressions,
      clicks: finalClicks,
      ctr,
      followerPulse,
    };
  }, [ads]);

  const handleDepositSimulate = useCallback((amount: number) => {
    setAdvertiserBalance(prev => prev + amount);
    toast({
      title: '💳 تم شحن الحساب بنجاح',
      description: `تم تعبئة ميزانيتك بـ ${amount} دينار بنجاح عبر ${form.paymentChannel}.`,
    });
  }, [form.paymentChannel, toast]);

  const allSovereignAds = useMemo(() => {
    const pendingMap = new Map((pendingAds || []).map(item => [item.id, item]));

    const list = ads.map(ad => {
      if (pendingMap.has(ad.id)) {
        return { ...ad, ...pendingMap.get(ad.id), status: 'PENDING' };
      }
      return ad;
    });

    const adIds = new Set(list.map(a => a.id));
    (pendingAds || []).forEach(pending => {
      if (!adIds.has(pending.id)) {
        list.push(pending);
      }
    });

    return list;
  }, [ads, pendingAds]);

  return {
    ads,
    pendingAds,
    allSovereignAds,
    pulseData,
    activeTab,
    setActiveTab,
    expandedAdId,
    setExpandedAdId,
    advertiserBalance,
    ledgerStats,
    handleDepositSimulate,
    toggleAdStatus,
    deleteAd,
    extendAd,
    ...form,
    ...audit,
  };
}
