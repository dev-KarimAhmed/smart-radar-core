import { useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '../use-toast';
import { trackSovereignError } from '@/lib/error-tracker';
import { useTranslations } from 'next-intl';
import { SovereignAd } from './admin-ads-types';

export function useAdminAdsLifecycle({
  ads,
  localPromos,
  dbPromos,
  updateLocalPromos,
  isProcessingRef,
  setIsProcessing,
}: {
  ads: SovereignAd[];
  localPromos: SovereignAd[];
  dbPromos: SovereignAd[];
  updateLocalPromos: (updater: (prev: SovereignAd[]) => SovereignAd[]) => void;
  isProcessingRef: React.MutableRefObject<boolean>;
  setIsProcessing: (val: boolean) => void;
}) {
  const tAuto = useTranslations();
  const { toast } = useToast();

  // 1. تعليق / إلغاء تعليق (Pause / Play)
  const toggleAdStatus = useCallback(async (adId: string, currentStatus: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const isCurrentlyActive = (currentStatus || '').toLowerCase() === 'active';
      const newStatus = isCurrentlyActive ? 'paused' : 'active';
      const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some((p) => p.id === adId);

      if (isMock) {
        updateLocalPromos((prev) => prev.map((a) => (a.id === adId ? { ...a, status: newStatus } : a)));
        toast({ title: 'تعديل حالة الإعلان الملاحي', description: `الحملة الآن: ${newStatus === 'active' ? 'نشطة ●' : 'موقوفة مؤقتاً ||'}.` });
      } else {
        try {
          const adRef = doc(db, 'promos', adId);
          await updateDoc(adRef, { status: newStatus });
          toast({ title: 'تعديل حالة الإعلان الملاحي', description: `الحملة الآن: ${newStatus === 'active' ? 'نشطة ●' : 'موقوفة مؤقتاً ||'}.` });
        } catch (fbError) {
          console.warn('Firebase update status failed, falling back to local:', fbError);
          updateLocalPromos((prev) => {
            const existing = prev.find((a) => a.id === adId);
            if (existing) {
              return prev.map((a) => (a.id === adId ? { ...a, status: newStatus } : a));
            } else {
              const dbAd = dbPromos.find((a) => a.id === adId);
              if (dbAd) {
                return [...prev, { ...dbAd, status: newStatus }];
              }
            }
            return prev;
          });
          toast({ title: 'تعديل حالة الإعلان الملاحي (محلي)', description: `الحملة الآن: ${newStatus === 'active' ? 'نشطة ●' : 'موقوفة مؤقتاً ||'}.` });
        }
      }
    } catch (error) {
      trackSovereignError(error, { context: 'ToggleAdStatus_Direct' });
      toast({ variant: 'destructive', title: 'فشل الإدارة على الحالة' });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [localPromos, dbPromos, toast, updateLocalPromos, isProcessingRef, setIsProcessing]);

  // 2. حذف / أرشفة (Delete)
  const deleteAd = useCallback(async (adId: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some((p) => p.id === adId);
      if (isMock) {
        updateLocalPromos((prev) => prev.map((a) => (a.id === adId ? { ...a, status: 'archived' } : a)));
        toast({ title: tAuto('campaignArchived') });
      } else {
        try {
          const adRef = doc(db, 'promos', adId);
          await updateDoc(adRef, { status: 'archived' });
          toast({ title: tAuto('campaignArchived') });
        } catch (fbError) {
          console.warn('Firebase delete failed, falling back to local:', fbError);
          updateLocalPromos((prev) => {
            const existing = prev.find((a) => a.id === adId);
            if (existing) {
              return prev.map((a) => (a.id === adId ? { ...a, status: 'archived' } : a));
            } else {
              const dbAd = dbPromos.find((a) => a.id === adId);
              if (dbAd) {
                return [...prev, { ...dbAd, status: 'archived' }];
              }
            }
            return prev;
          });
          toast({ title: tAuto('campaignArchivedLocal') });
        }
      }
    } catch (error) {
      trackSovereignError(error, { context: 'DeleteAd_Direct' });
      toast({ variant: 'destructive', title: tAuto('failedToArchiveCampaign') });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [localPromos, dbPromos, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]);

  // 3. تجميد العقد (Freeze)
  const freezeAd = useCallback(async (adId: string, isFrozen: boolean) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const targetStatus = isFrozen ? 'active' : 'frozen';
      const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some((p) => p.id === adId);
      if (isMock) {
        updateLocalPromos((prev) => prev.map((a) => (a.id === adId ? { ...a, status: targetStatus } : a)));
        toast({ title: isFrozen ? tAuto('campaignActivated') : tAuto('campaignPausedTemp') });
      } else {
        try {
          const adRef = doc(db, 'promos', adId);
          await updateDoc(adRef, { status: targetStatus });
          toast({ title: isFrozen ? tAuto('campaignActivated') : tAuto('campaignPausedTemp') });
        } catch (fbError) {
          console.warn('Firebase freeze failed, falling back to local:', fbError);
          updateLocalPromos((prev) => {
            const existing = prev.find((a) => a.id === adId);
            if (existing) {
              return prev.map((a) => (a.id === adId ? { ...a, status: targetStatus } : a));
            } else {
              const dbAd = dbPromos.find((a) => a.id === adId);
              if (dbAd) {
                return [...prev, { ...dbAd, status: targetStatus }];
              }
            }
            return prev;
          });
          toast({ title: isFrozen ? tAuto('campaignActivatedLocal') : tAuto('campaignPausedTempLocal') });
        }
      }
    } catch (error) {
      trackSovereignError(error, { context: 'FreezeAd_Direct' });
      toast({ variant: 'destructive', title: tAuto('failedToFreezeCampaign') });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [localPromos, dbPromos, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]);

  // 4. تمديد التاريخ والظهور (Extend)
  const extendAd = useCallback(async (adId: string, extraImpressions: number, extraDays: number) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const adDoc = ads.find((a) => a.id === adId);
      const currentTarget = adDoc?.targetImpressions || 10000;
      const currentEndDate = adDoc?.endDate ? new Date(adDoc.endDate) : new Date();
      currentEndDate.setDate(currentEndDate.getDate() + extraDays);
      const newEndDateStr = currentEndDate.toISOString().split('T')[0];

      const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some((p) => p.id === adId);
      if (isMock) {
        updateLocalPromos((prev) =>
          prev.map((a) =>
            a.id === adId
              ? {
                  ...a,
                  targetImpressions: currentTarget + extraImpressions,
                  endDate: newEndDateStr,
                }
              : a
          )
        );
        toast({ title: tAuto('campaignCapacityExtended') });
      } else {
        try {
          const adRef = doc(db, 'promos', adId);
          await updateDoc(adRef, {
            targetImpressions: currentTarget + extraImpressions,
            endDate: newEndDateStr,
          });
          toast({ title: tAuto('campaignCapacityExtended') });
        } catch (fbError) {
          console.warn('Firebase extend failed, falling back to local:', fbError);
          updateLocalPromos((prev) => {
            const existing = prev.find((a) => a.id === adId);
            if (existing) {
              return prev.map((a) =>
                a.id === adId
                  ? {
                      ...a,
                      targetImpressions: currentTarget + extraImpressions,
                      endDate: newEndDateStr,
                    }
                  : a
              );
            } else {
              const dbAd = dbPromos.find((a) => a.id === adId);
              if (dbAd) {
                return [
                  ...prev,
                  {
                    ...dbAd,
                    targetImpressions: currentTarget + extraImpressions,
                    endDate: newEndDateStr,
                  },
                ];
              }
            }
            return prev;
          });
          toast({ title: tAuto('campaignCapacityExtendedLocal') });
        }
      }
    } catch (error) {
      trackSovereignError(error, { context: 'ExtendAd_Direct' });
      toast({ variant: 'destructive', title: tAuto('failedToExtendCampaign') });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [ads, localPromos, dbPromos, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]);

  return {
    toggleAdStatus,
    deleteAd,
    freezeAd,
    extendAd,
  };
}
