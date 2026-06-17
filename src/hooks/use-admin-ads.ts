'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { trackSovereignError } from '@/lib/error-tracker';
import { broadcastSilentPush } from '@/lib/push-notifications';

export interface SovereignAd {
  id: string;
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
}

export function useAdminAds() {
  const [ads, setAds] = useState<SovereignAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    // Listen directly to the unified 'promos' collection for real-time synchronization
    const promosQuery = query(collection(db, 'promos'));

    const unsubscribe = onSnapshot(promosQuery, (snapshot) => {
      if (snapshot.empty) {
        // Fallback simulation mock ads matching Jordan & Iraq context
        setAds([
          {
            id: 'promo-wadi-seer',
            status: 'active',
            content: {
              title: 'مركز أعمال وادي السير الحرفي المطور',
              description: 'لأبناء لواء وادي السير: احصل على تمويل تنموي للمشاريع الحرة بصفر فوائد واستدامة نسيجية.',
              posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
            },
            role: 'all',
            phone: '0790123456',
            whatsapp: '962790123456',
            targetDistrict: 'وادي السير',
            targetGovernorate: 'عمان',
            currentImpressions: 4890,
            targetImpressions: 10000,
            clicksCount: 312,
            endDate: '2026-12-31'
          },
          {
            id: 'promo-university',
            status: 'active',
            content: {
              title: 'ملتقى تكنولوجيا الجامعة السيادي',
              description: 'لرواد قطاع الجامعة: حلول الذكاء الاصطناعي كحارس أمين (AI Sentry) وحلول الحوسبة السحابية الحرة بميزانية صفرية.',
              posterUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200',
            },
            role: 'all',
            phone: '0790111222',
            whatsapp: '962790111222',
            targetDistrict: 'الجامعة',
            targetGovernorate: 'عمان',
            currentImpressions: 1200,
            targetImpressions: 5000,
            clicksCount: 94,
            endDate: '2026-09-30'
          }
        ]);
      } else {
        const fetchedPromos = snapshot.docs.map(docSnap => {
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
            ...data
          } as SovereignAd;
        });
        setAds(fetchedPromos);
      }
      setIsLoading(false);
    }, (error) => {
      trackSovereignError(error, { context: 'FetchPromos_Admin' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create Campaign
  const createAd = useCallback(async (adData: AdInput): Promise<boolean> => {
    setIsProcessing(true);
    try {
      const adModel = {
        status: adData.status || 'PENDING',
        endDate: '2026-12-31',
        createdAt: new Date().toISOString(),
        currentImpressions: 0,
        clicksCount: 0,
        role: 'all',
        ...adData,
        content: {
          title: adData.title,
          description: adData.description,
          posterUrl: adData.posterUrl,
        },
        action: {
          buttonText: adData.buttonText || 'احجز مقعدك الآن',
          actionUrl: `https://wa.me/${adData.whatsapp || '962790000000'}`,
        }
      };

      const promosRef = collection(db, 'promos');
      await addDoc(promosRef, adModel);
      toast({ title: 'تم إدراج الإعلان الملاحي', description: `تم غرس الحملة "${adData.title}" في نبض الخريطة الميدانية بنجاح.` });
      return true;
    } catch (error) {
      trackSovereignError(error, { context: 'CreatePromo_Admin_Failed' });
      toast({ variant: 'destructive', title: 'فشل غرس الحملة' });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // 1. تعليق / إلغاء تعليق (Pause / Play) - السيادة الإدارية الأولى
  const toggleAdStatus = useCallback(async (adId: string, currentStatus: string) => {
    setIsProcessing(true);
    try {
      const adRef = doc(db, 'promos', adId);
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await updateDoc(adRef, { status: newStatus });
      toast({ title: 'تعديل حالة الإعلان الملاحي', description: `الحملة الآن: ${newStatus === 'active' ? 'نشطة ●' : 'موقوفة مؤقتاً ||'}.` });
    } catch (error) {
      trackSovereignError(error, { context: 'ToggleAdStatus_Direct' });
      toast({ variant: 'destructive', title: 'فشل السيادة على الحالة' });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // 2. حذف / أرشفة (Delete) - السيادة الإدارية الثانية
  const deleteAd = useCallback(async (adId: string) => {
    setIsProcessing(true);
    try {
      const adRef = doc(db, 'promos', adId);
      await updateDoc(adRef, { status: 'archived' });
      toast({ title: 'تمت السيادة: أرشفة الحملة وحذفها من البث' });
    } catch (error) {
      trackSovereignError(error, { context: 'DeleteAd_Direct' });
      toast({ variant: 'destructive', title: 'فشل أرشفة الحملة' });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // 3. تجميد العقد (Freeze) - السيادة الإدارية الثالثة
  const freezeAd = useCallback(async (adId: string, isFrozen: boolean) => {
    setIsProcessing(true);
    try {
      const adRef = doc(db, 'promos', adId);
      const targetStatus = isFrozen ? 'active' : 'frozen';
      await updateDoc(adRef, { status: targetStatus });
      toast({ title: isFrozen ? 'تم فك تجميد الحملة وكابل الطوارئ' : 'تم تجميد الحملة البصرية بنجاح وبقرار سيادي مغلق' });
    } catch (error) {
      trackSovereignError(error, { context: 'FreezeAd_Direct' });
      toast({ variant: 'destructive', title: 'فشل تجميد الحملة' });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // 4. تمديد التاريخ والظهور (Extend) - السيادة الإدارية الرابعة
  const extendAd = useCallback(async (adId: string, extraImpressions: number, extraDays: number) => {
    setIsProcessing(true);
    try {
      const adRef = doc(db, 'promos', adId);
      const adDoc = ads.find(a => a.id === adId);
      const currentTarget = adDoc?.targetImpressions || 10000;
      const currentEndDate = adDoc?.endDate ? new Date(adDoc.endDate) : new Date();
      currentEndDate.setDate(currentEndDate.getDate() + extraDays);
      
      await updateDoc(adRef, {
        targetImpressions: currentTarget + extraImpressions,
        endDate: currentEndDate.toISOString().split('T')[0]
      });
      toast({ title: 'تمت السيادة المطلقة وتمديد السعة الميدانية للحملة بنجاح.' });
    } catch (error) {
      trackSovereignError(error, { context: 'ExtendAd_Direct' });
      toast({ variant: 'destructive', title: 'فشل تمديد معالم الحملة' });
    } finally {
      setIsProcessing(false);
    }
  }, [ads, toast]);

  const approveAd = useCallback(async (adId: string) => {
    setIsProcessing(true);
    try {
      const adRef = doc(db, 'promos', adId);
      await updateDoc(adRef, { status: 'ACTIVE', isSovereignStopped: false, rejectionReason: '' });
      toast({ title: '✅ اعتماد سيادي', description: 'تم قذف الإعلان إلى النهر الميداني بنجاح.' });
    } catch (error: any) {
      trackSovereignError(error, { context: 'ApproveAd_Admin' });
      toast({ variant: 'destructive', title: 'فشل الاعتماد', description: error.message || 'خطأ في قاموس السحابة.' });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const rejectAd = useCallback(async (adId: string, reason: string) => {
    if (!reason.trim()) {
      toast({ variant: 'destructive', title: 'رفض الإجراء', description: 'إفادة المدعي العام (سبب الرفض) إلزامية.' });
      return;
    }
    setIsProcessing(true);
    try {
      const adRef = doc(db, 'promos', adId);
      await updateDoc(adRef, { status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason });
      toast({ title: '🚫 إعدام سيادي', description: 'تم رفض الإعلان وتوثيق الإفادة للمعلن.' });
    } catch (error: any) {
      trackSovereignError(error, { context: 'RejectAd_Admin' });
      toast({ variant: 'destructive', title: 'فشل الرفض', description: error.message || 'خطأ في قاموس السحابة.' });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // 🛡️ [RAD-MAP-076-KILL-SWITCH] executeAdAnnihilation (Digital Annihilation)
  const executeAdAnnihilation = useCallback(async (adId: string, reason: string) => {
    if (!reason.trim()) {
      toast({ variant: 'destructive', title: 'فشل الإعدام', description: 'يتعين تحديد سبب التطهير الجنائي لتبرير الإبادة الرقمية.' });
      return false;
    }
    setIsProcessing(true);
    try {
      const adRef = doc(db, 'promos', adId);
      
      // 1. Update Firestore state
      await updateDoc(adRef, {
        status: 'REJECTED',
        isSovereignStopped: true,
        rejectionReason: `[إبادة رقمية فورية]: ${reason}`
      });

      // 2. Broadcast Silent Web Push for immediate local cache purge
      await broadcastSilentPush({
        type: 'PURGE_AD',
        targetId: adId,
        message: `تم تفعيل مقصلة الإجراء وتطهير الإعلان [${adId}] من الذاكرات الميدانية بسبب: ${reason}`
      });

      toast({
        title: '💥 تم إعدام وتطهير الإعلان رقمياً',
        description: 'تم مسح وتغطية البث وإرسال النبضة الصامتة Silent Web Push للتطهير اللحظي.'
      });
      return true;
    } catch (error: any) {
      trackSovereignError(error, { context: 'AdAnnihilation_Failed' });
      toast({ variant: 'destructive', title: 'فشل محرك التطهير الكلي', description: error.message || 'خطأ في الإرسال الكوانتي.' });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return { ads, isLoading, isProcessing, createAd, toggleAdStatus, deleteAd, freezeAd, extendAd, approveAd, rejectAd, executeAdAnnihilation };
}
