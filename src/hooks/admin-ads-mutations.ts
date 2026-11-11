'use client';

import { useCallback, type MutableRefObject } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import { broadcastSilentPush } from '@/lib/push-notifications';
import type { SovereignAd } from './use-admin-ads';

interface AdsMutationsOptions {
  localPromos: SovereignAd[];
  dbPromos: SovereignAd[];
  ads: SovereignAd[];
  updateLocalPromos: (updater: (prev: SovereignAd[]) => SovereignAd[]) => void;
  isProcessingRef: MutableRefObject<boolean>;
  setIsProcessing: (val: boolean) => void;
  toast: (props: { variant?: 'default' | 'destructive'; title?: string; description?: string }) => void;
  tAuto: (key: string, values?: Record<string, any>) => string;
  isArabic?: boolean;
}

export function useAdminAdsMutations({
  localPromos,
  dbPromos,
  ads,
  updateLocalPromos,
  isProcessingRef,
  setIsProcessing,
  toast,
  tAuto,
  isArabic = true,
}: AdsMutationsOptions) {
  // 1. Pause / Play
  const toggleAdStatus = useCallback(
    async (adId: string, currentStatus: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setIsProcessing(true);
      try {
        const isCurrentlyActive = (currentStatus || '').toLowerCase() === 'active';
        const newStatus = isCurrentlyActive ? 'paused' : 'active';
        const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some((p) => p.id === adId);

        const statusLabel = isArabic
          ? newStatus === 'active'
            ? 'نشطة ●'
            : 'موقوفة مؤقتاً ||'
          : newStatus === 'active'
            ? 'Active ●'
            : 'Paused ||';

        if (isMock) {
          updateLocalPromos((prev) => prev.map((a) => (a.id === adId ? { ...a, status: newStatus } : a)));
          toast({
            title: isArabic ? 'تعديل حالة الإعلان الملاحي' : 'Campaign Status Updated',
            description: isArabic ? `الحملة الآن: ${statusLabel}.` : `Campaign is now: ${statusLabel}.`,
          });
        } else {
          try {
            const adRef = doc(db, 'promos', adId);
            await updateDoc(adRef, { status: newStatus });
            toast({
              title: isArabic ? 'تعديل حالة الإعلان الملاحي' : 'Campaign Status Updated',
              description: isArabic ? `الحملة الآن: ${statusLabel}.` : `Campaign is now: ${statusLabel}.`,
            });
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
            toast({
              title: isArabic ? 'تعديل حالة الإعلان الملاحي (محلي)' : 'Campaign Status Updated (Local)',
              description: isArabic ? `الحملة الآن: ${statusLabel}.` : `Campaign is now: ${statusLabel}.`,
            });
          }
        }
      } catch (error) {
        trackSovereignError(error, { context: 'ToggleAdStatus_Direct' });
        toast({
          variant: 'destructive',
          title: isArabic ? 'فشل تحديث حالة الإعلان' : 'Failed to update campaign status',
        });
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [localPromos, dbPromos, isArabic, toast, updateLocalPromos, isProcessingRef, setIsProcessing]
  );

  // 2. Delete / Archive
  const deleteAd = useCallback(
    async (adId: string) => {
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
    },
    [localPromos, dbPromos, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]
  );

  // 3. Freeze / Unfreeze
  const freezeAd = useCallback(
    async (adId: string, isFrozen: boolean) => {
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
    },
    [localPromos, dbPromos, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]
  );

  // 4. Extend capacity and date
  const extendAd = useCallback(
    async (adId: string, extraImpressions: number, extraDays: number) => {
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
    },
    [ads, localPromos, dbPromos, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]
  );

  const approveAd = useCallback(
    async (adId: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setIsProcessing(true);
      try {
        const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some((p) => p.id === adId);
        if (isMock) {
          updateLocalPromos((prev) =>
            prev.map((a) =>
              a.id === adId
                ? { ...a, status: 'active', isSovereignStopped: false, rejectionReason: '' }
                : a
            )
          );
          toast({ title: tAuto('adApproved'), description: tAuto('adPublished') });
        } else {
          try {
            const adRef = doc(db, 'promos', adId);
            await updateDoc(adRef, { status: 'active', isSovereignStopped: false, rejectionReason: '' });
            toast({ title: tAuto('adApproved'), description: tAuto('adPublished') });
          } catch (fbError) {
            console.warn('Firebase approve failed, falling back to local:', fbError);
            updateLocalPromos((prev) => {
              const existing = prev.find((a) => a.id === adId);
              if (existing) {
                return prev.map((a) =>
                  a.id === adId
                    ? { ...a, status: 'active', isSovereignStopped: false, rejectionReason: '' }
                    : a
                );
              } else {
                const dbAd = dbPromos.find((a) => a.id === adId);
                if (dbAd) {
                  return [...prev, { ...dbAd, status: 'active', isSovereignStopped: false, rejectionReason: '' }];
                }
              }
              return prev;
            });
            toast({ title: tAuto('adApprovedLocal'), description: tAuto('adPublished') });
          }
        }
      } catch (error: any) {
        trackSovereignError(error, { context: 'ApproveAd_Admin' });
        toast({
          variant: 'destructive',
          title: tAuto('approvalFailed'),
          description: error.message || tAuto('cloudDictionaryError'),
        });
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [localPromos, dbPromos, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]
  );

  const rejectAd = useCallback(
    async (adId: string, reason: string) => {
      if (!reason.trim()) {
        toast({
          variant: 'destructive',
          title: tAuto('actionRejected'),
          description: tAuto('rejectionReasonRequired'),
        });
        return;
      }
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setIsProcessing(true);
      try {
        const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some((p) => p.id === adId);
        if (isMock) {
          updateLocalPromos((prev) =>
            prev.map((a) =>
              a.id === adId
                ? { ...a, status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason }
                : a
            )
          );
          toast({ title: tAuto('adRejected'), description: tAuto('rejectionReasonSaved') });
        } else {
          try {
            const adRef = doc(db, 'promos', adId);
            await updateDoc(adRef, { status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason });
            toast({ title: tAuto('adRejected'), description: tAuto('rejectionReasonSaved') });
          } catch (fbError) {
            console.warn('Firebase reject failed, falling back to local:', fbError);
            updateLocalPromos((prev) => {
              const existing = prev.find((a) => a.id === adId);
              if (existing) {
                return prev.map((a) =>
                  a.id === adId
                    ? { ...a, status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason }
                    : a
                );
              } else {
                const dbAd = dbPromos.find((a) => a.id === adId);
                if (dbAd) {
                  return [
                    ...prev,
                    { ...dbAd, status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason },
                  ];
                }
              }
              return prev;
            });
            toast({ title: tAuto('adRejectedLocal'), description: tAuto('rejectionReasonSaved') });
          }
        }
      } catch (error: any) {
        trackSovereignError(error, { context: 'RejectAd_Admin' });
        toast({
          variant: 'destructive',
          title: tAuto('rejectionFailed'),
          description: error.message || tAuto('cloudDictionaryError'),
        });
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [localPromos, dbPromos, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]
  );

  // 🛡️ executeAdAnnihilation (Digital Annihilation)
  const executeAdAnnihilation = useCallback(
    async (adId: string, reason: string) => {
      if (!reason.trim()) {
        toast({
          variant: 'destructive',
          title: tAuto('couldNotStopAd'),
          description: tAuto('stopReasonRequired'),
        });
        return false;
      }
      if (isProcessingRef.current) return false;
      isProcessingRef.current = true;
      setIsProcessing(true);
      try {
        const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some((p) => p.id === adId);
        if (isMock) {
          updateLocalPromos((prev) =>
            prev.map((a) =>
              a.id === adId
                ? {
                    ...a,
                    status: 'REJECTED',
                    isSovereignStopped: true,
                    rejectionReason: tAuto('adStoppedReason', { reason }),
                  }
                : a
            )
          );
          toast({
            title: tAuto('adStopped'),
            description: tAuto('adStoppedAlertSent'),
          });
        } else {
          try {
            const adRef = doc(db, 'promos', adId);
            await updateDoc(adRef, {
              status: 'REJECTED',
              isSovereignStopped: true,
              rejectionReason: tAuto('adStoppedReason', { reason }),
            });

            await broadcastSilentPush({
              type: 'PURGE_AD',
              targetId: adId,
              message: tAuto('adStoppedPushMessage', { adId, reason }),
            });

            toast({
              title: tAuto('adStopped'),
              description: tAuto('adStoppedAlertSent'),
            });
          } catch (fbError) {
            console.warn('Firebase execution failed, falling back to local:', fbError);
            updateLocalPromos((prev) => {
              const existing = prev.find((a) => a.id === adId);
              if (existing) {
                return prev.map((a) =>
                  a.id === adId
                    ? {
                        ...a,
                        status: 'REJECTED',
                        isSovereignStopped: true,
                        rejectionReason: tAuto('adStoppedReason', { reason }),
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
                      status: 'REJECTED',
                      isSovereignStopped: true,
                      rejectionReason: tAuto('adStoppedReason', { reason }),
                    },
                  ];
                }
              }
              return prev;
            });
            toast({
              title: isArabic ? 'تم إيقاف الإعلان محلياً' : 'Ad Stopped Locally',
              description: isArabic ? 'تم إيقاف عرض الإعلان محلياً.' : 'Ad display stopped locally.',
            });
          }
        }
        return true;
      } catch (error: any) {
        trackSovereignError(error, { context: 'AdAnnihilation_Failed' });
        toast({
          variant: 'destructive',
          title: isArabic ? 'تعذر إيقاف الإعلان' : 'Could Not Stop Ad',
          description: error.message || (isArabic ? 'حدث خطأ أثناء إرسال الطلب.' : 'An error occurred while submitting the request.'),
        });
        return false;
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [localPromos, dbPromos, isArabic, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]
  );

  return {
    toggleAdStatus,
    deleteAd,
    freezeAd,
    extendAd,
    approveAd,
    rejectAd,
    executeAdAnnihilation,
  };
}
