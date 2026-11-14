import { useCallback, useRef, useState } from 'react';
import { collection, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '../use-toast';
import { trackSovereignError } from '@/lib/error-tracker';
import { broadcastSilentPush } from '@/lib/push-notifications';
import { useTranslations } from 'next-intl';
import { AdInput, SovereignAd } from './admin-ads-types';

export function useAdminAdsMutations({
  localPromos,
  dbPromos,
  updateLocalPromos,
}: {
  localPromos: SovereignAd[];
  dbPromos: SovereignAd[];
  updateLocalPromos: (updater: (prev: SovereignAd[]) => SovereignAd[]) => void;
}) {
  const tAuto = useTranslations();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  // Create Campaign
  const createAd = useCallback(
    async (adData: AdInput): Promise<boolean> => {
      if (isProcessingRef.current) return false;
      isProcessingRef.current = true;
      setIsProcessing(true);
      try {
        const generatedId = doc(collection(db, 'promos')).id;
        const adModel = {
          id: generatedId,
          status: adData.status || 'active',
          endDate: adData.endDate || '2026-12-31',
          createdAt: new Date().toISOString(),
          currentImpressions: 0,
          clicksCount: 0,
          role: adData.role || 'all',
          ...adData,
          content: {
            title: adData.title,
            description: adData.description,
            posterUrl: adData.posterUrl,
          },
          action: {
            buttonText: adData.buttonText || 'احجز مقعدك الآن',
            actionUrl: adData.actionUrl || `https://wa.me/${adData.whatsapp || '962790000000'}`,
          },
        };

        try {
          const promoDocRef = doc(db, 'promos', generatedId);
          await runTransaction(db, async (transaction) => {
            const districtKey = (adData.targetDistrict || 'global').replace(/\s+/g, '_');
            const counterRef = doc(db, 'system_counters', `${districtKey}_advertisement_serial`);
            const counterSnap = await transaction.get(counterRef);
            let nextCount = 1001;
            if (counterSnap.exists()) {
              nextCount = (counterSnap.data().current_count || 1000) + 1;
            }
            const serial_id = `A-${nextCount}`;
            const finalAdModel = { ...adModel, serial_id };

            transaction.set(counterRef, { current_count: nextCount }, { merge: true });
            transaction.set(promoDocRef, finalAdModel);
          });
          toast({ title: 'تم إنشاء الإعلان', description: `تم حفظ الحملة "${adData.title}" بنجاح.` });
        } catch (fbError) {
          console.warn('Firebase write failed, falling back to sovereign local storage:', fbError);
          updateLocalPromos((prev) => [adModel as SovereignAd, ...prev]);
          toast({
            title: 'تم الحفظ محلياً',
            description: `تم إضافة الحملة "${adData.title}" محلياً في الرادار لتخطّي قيود البيئة التجريبية بنجاح.`,
          });
        }
        return true;
      } catch (error) {
        trackSovereignError(error, { context: 'CreatePromo_Admin_Failed' });
        toast({ variant: 'destructive', title: 'فشل إضافة الحملة' });
        return false;
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [toast, updateLocalPromos]
  );

  // 🛡️ [RAD-MAP-076-KILL-SWITCH] executeAdAnnihilation (Digital Annihilation)
  const executeAdAnnihilation = useCallback(
    async (adId: string, reason: string): Promise<boolean> => {
      if (!reason.trim()) {
        toast({ variant: 'destructive', title: tAuto('couldNotStopAd'), description: tAuto('stopReasonRequired') });
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
                ? { ...a, status: 'REJECTED', isSovereignStopped: true, rejectionReason: tAuto('adStoppedReason', { reason }) }
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
                    ? { ...a, status: 'REJECTED', isSovereignStopped: true, rejectionReason: `[إيقاف الإعلان]: ${reason}` }
                    : a
                );
              } else {
                const dbAd = dbPromos.find((a) => a.id === adId);
                if (dbAd) {
                  return [...prev, { ...dbAd, status: 'REJECTED', isSovereignStopped: true, rejectionReason: `[إيقاف الإعلان]: ${reason}` }];
                }
              }
              return prev;
            });
            toast({
              title: 'تم إيقاف الإعلان محلياً',
              description: 'تم إيقاف عرض الإعلان محلياً.',
            });
          }
        }
        return true;
      } catch (error: any) {
        trackSovereignError(error, { context: 'AdAnnihilation_Failed' });
        toast({ variant: 'destructive', title: 'تعذر إيقاف الإعلان', description: error.message || 'حدث خطأ أثناء إرسال الطلب.' });
        return false;
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [localPromos, dbPromos, toast, updateLocalPromos, tAuto]
  );

  return {
    isProcessing,
    isProcessingRef,
    setIsProcessing,
    createAd,
    executeAdAnnihilation,
  };
}
