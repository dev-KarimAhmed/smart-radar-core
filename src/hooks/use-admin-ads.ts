'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { trackSovereignError } from '@/lib/error-tracker';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from './use-dashboard-language';
import { useAdminAdsMutations } from './admin-ads-mutations';

export interface SovereignAd {
  id: string;
  serial_id?: string;
  status: 'active' | 'paused' | 'archived' | 'frozen' | 'ACTIVE' | 'PENDING' | 'REJECTED' | 'FROZEN' | string;
  content?: {
    title: string;
    description: string;
    posterUrl: string;
  };
  title?: string;
  description?: string;
  posterUrl?: string;
  phone?: string;
  whatsapp?: string;
  geoLoc?: string;
  targetDistrict?: string;
  targetGovernorate?: string;
  currentImpressions?: number;
  targetImpressions?: number;
  clicksCount?: number;
  role?: string;
  endDate?: string;
  createdAt?: any;
  isPremiumRetentionPaid?: boolean;
  expirationTimestamp?: number;
  adType?: string;
  isSovereignStopped?: boolean;
  rejectionReason?: string;
  packageId?: string;
  geo?: {
    governorate?: string;
    district?: string;
  };
}

export interface AdInput {
  title: string;
  description: string;
  posterUrl: string;
  actionUrl?: string;
  targetDistrict?: string;
  targetGovernorate?: string;
  targetImpressions: number;
  phone?: string;
  whatsapp?: string;
  geoLoc?: string;
  buttonText?: string;
  isPremiumRetentionPaid?: boolean;
  expirationTimestamp?: number;
  adType?: string;
  status?: string;
  packageId?: string;
  endDate?: string;
  role?: string;
}

export function useAdminAds() {
  const tAuto = useTranslations();
  const { isArabic } = useDashboardLanguage();
  const [localPromos, setLocalPromos] = useState<SovereignAd[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('sovereign_local_promos');
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        console.error('Failed loading cached local promos:', e);
      }
    }
    return [];
  });
  const [dbPromos, setDbPromos] = useState<SovereignAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const { toast } = useToast();

  const updateLocalPromos = useCallback((updater: (prev: SovereignAd[]) => SovereignAd[]) => {
    setLocalPromos((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sovereign_local_promos', JSON.stringify(next));
        } catch (e) {
          console.error('Failed caching local promos:', e);
        }
      }
      return next;
    });
  }, []);

  const ads = useMemo(() => {
    const merged = [...localPromos];
    dbPromos.forEach((dbAd) => {
      if (!merged.some((l) => l.id === dbAd.id)) {
        merged.push(dbAd);
      }
    });
    return merged;
  }, [dbPromos, localPromos]);

  useEffect(() => {
    setIsLoading(true);
    const promosQuery = query(collection(db, 'promos'));

    const unsubscribe = onSnapshot(
      promosQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setDbPromos([]);
        } else {
          const fetchedPromos = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              status: data.status || 'active',
              content: {
                title: data.content?.title || data.title || '',
                description: data.content?.description || data.description || '',
                posterUrl: data.content?.posterUrl || data.posterUrl || '',
              },
              phone: data.phone || '0790000000',
              whatsapp: data.whatsapp || '962790000000',
              targetDistrict: data.targetDistrict,
              targetGovernorate: data.targetGovernorate || 'عمان',
              currentImpressions: data.currentImpressions || 0,
              targetImpressions: data.targetImpressions || 10000,
              clicksCount: data.clicksCount || 0,
              role: data.role || 'all',
              endDate: data.endDate || '2026-12-31',
              ...data,
            } as SovereignAd;
          });
          setDbPromos(fetchedPromos);
        }
        setIsLoading(false);
      },
      (error) => {
        trackSovereignError(error, { context: 'FetchPromos_Admin' });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
            buttonText: adData.buttonText || (isArabic ? 'احجز مقعدك الآن' : 'Book Your Seat Now'),
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
          toast({
            title: isArabic ? 'تم إنشاء الإعلان' : 'Campaign Created',
            description: isArabic
              ? `تم حفظ الحملة "${adData.title}" بنجاح.`
              : `Campaign "${adData.title}" saved successfully.`,
          });
        } catch (fbError) {
          console.warn('Firebase write failed, falling back to sovereign local storage:', fbError);
          updateLocalPromos((prev) => [adModel as SovereignAd, ...prev]);
          toast({
            title: isArabic ? 'تم الحفظ محلياً' : 'Saved Locally',
            description: isArabic
              ? `تم إضافة الحملة "${adData.title}" محلياً في الرادار لتخطّي قيود البيئة التجريبية بنجاح.`
              : `Campaign "${adData.title}" added locally on the radar.`,
          });
        }
        return true;
      } catch (error) {
        trackSovereignError(error, { context: 'CreatePromo_Admin_Failed' });
        toast({ variant: 'destructive', title: isArabic ? 'فشل إضافة الحملة' : 'Failed to create campaign' });
        return false;
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [isArabic, toast, updateLocalPromos]
  );

  const {
    toggleAdStatus,
    deleteAd,
    freezeAd,
    extendAd,
    approveAd,
    rejectAd,
    executeAdAnnihilation,
  } = useAdminAdsMutations({
    localPromos,
    dbPromos,
    ads,
    updateLocalPromos,
    isProcessingRef,
    setIsProcessing,
    toast,
    tAuto,
    isArabic,
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
