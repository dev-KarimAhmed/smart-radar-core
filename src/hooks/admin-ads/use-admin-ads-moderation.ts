import { useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '../use-toast';
import { trackSovereignError } from '@/lib/error-tracker';
import { useTranslations } from 'next-intl';
import { SovereignAd } from './admin-ads-types';

export function useAdminAdsModeration({
  localPromos,
  dbPromos,
  updateLocalPromos,
  isProcessingRef,
  setIsProcessing,
}: {
  localPromos: SovereignAd[];
  dbPromos: SovereignAd[];
  updateLocalPromos: (updater: (prev: SovereignAd[]) => SovereignAd[]) => void;
  isProcessingRef: React.MutableRefObject<boolean>;
  setIsProcessing: (val: boolean) => void;
}) {
  const tAuto = useTranslations();
  const { toast } = useToast();

  // اعتماد (Approve)
  const approveAd = useCallback(async (adId: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some((p) => p.id === adId);
      if (isMock) {
        updateLocalPromos((prev) =>
          prev.map((a) => (a.id === adId ? { ...a, status: 'active', isSovereignStopped: false, rejectionReason: '' } : a))
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
              return prev.map((a) => (a.id === adId ? { ...a, status: 'active', isSovereignStopped: false, rejectionReason: '' } : a));
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
      toast({ variant: 'destructive', title: tAuto('approvalFailed'), description: error.message || tAuto('cloudDictionaryError') });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [localPromos, dbPromos, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]);

  // رفض (Reject)
  const rejectAd = useCallback(async (adId: string, reason: string) => {
    if (!reason.trim()) {
      toast({ variant: 'destructive', title: tAuto('actionRejected'), description: tAuto('rejectionReasonRequired') });
      return;
    }
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some((p) => p.id === adId);
      if (isMock) {
        updateLocalPromos((prev) =>
          prev.map((a) => (a.id === adId ? { ...a, status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason } : a))
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
              return prev.map((a) => (a.id === adId ? { ...a, status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason } : a));
            } else {
              const dbAd = dbPromos.find((a) => a.id === adId);
              if (dbAd) {
                return [...prev, { ...dbAd, status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason }];
              }
            }
            return prev;
          });
          toast({ title: tAuto('adRejectedLocal'), description: tAuto('rejectionReasonSaved') });
        }
      }
    } catch (error: any) {
      trackSovereignError(error, { context: 'RejectAd_Admin' });
      toast({ variant: 'destructive', title: tAuto('rejectionFailed'), description: error.message || tAuto('cloudDictionaryError') });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [localPromos, dbPromos, toast, updateLocalPromos, tAuto, isProcessingRef, setIsProcessing]);

  return {
    approveAd,
    rejectAd,
  };
}
