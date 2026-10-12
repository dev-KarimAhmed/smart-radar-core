'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { trackSovereignError } from '@/lib/error-tracker';
import { broadcastSilentPush } from '@/lib/push-notifications';
import { useTranslations } from 'next-intl';

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
 const [localPromos, setLocalPromos] = useState<SovereignAd[]>(() => {
 if (typeof window !== 'undefined') {
 try {
 const cached = localStorage.getItem('sovereign_local_promos');
 return cached ? JSON.parse(cached) : [];
 } catch (e) {
 console.error("Failed loading cached local promos:", e);
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
 setLocalPromos(prev => {
 const next = updater(prev);
 if (typeof window !== 'undefined') {
 try {
 localStorage.setItem('sovereign_local_promos', JSON.stringify(next));
 } catch (e) {
 console.error("Failed caching local promos:", e);
 }
 }
 return next;
 });
 }, []);

 const ads = useMemo(() => {
 // Merge dbPromos and localPromos list
 // Items in localPromos override items with the exact same id in dbPromos
 const merged = [...localPromos];
 dbPromos.forEach(dbAd => {
 if (!merged.some(l => l.id === dbAd.id)) {
 merged.push(dbAd);
 }
 });
 return merged;
 }, [dbPromos, localPromos]);

 useEffect(() => {
 setIsLoading(true);
 // Listen directly to the unified 'promos' collection for real-time synchronization
 const promosQuery = query(collection(db, 'promos'));

 const unsubscribe = onSnapshot(promosQuery, (snapshot) => {
 if (snapshot.empty) {
 // Fallback simulation mock ads matching Jordan & Iraq context
 setDbPromos([
 {
 id: 'promo-wadi-seer',
 status: 'active',
 content: {
 title: 'مركز أعمال وادي السير الحرفي المطور',
 description: 'لأهالي وادي السير: احصل على تمويل للمشاريع الصغيرة بدون فوائد.',
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
 title: 'ملتقى تكنولوجيا الجامعة',
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
 setDbPromos(fetchedPromos);
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
 if (isProcessingRef.current) return false;
 isProcessingRef.current = true;
 setIsProcessing(true);
 try {
 const generatedId = `mock-${Date.now()}`;
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
 }
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
 console.warn("Firebase write failed, falling back to sovereign local storage:", fbError);
 // Fallback: inject directly into local React state and storage
 updateLocalPromos(prev => [adModel as SovereignAd, ...prev]);
 toast({
 title: 'تم الحفظ محلياً',
 description: `تم إضافة الحملة "${adData.title}" محلياً في الرادار لتخطّي قيود البيئة التجريبية بنجاح.`
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
 }, [toast, updateLocalPromos]);

 // 1. تعليق / إلغاء تعليق (Pause / Play)
 const toggleAdStatus = useCallback(async (adId: string, currentStatus: string) => {
 if (isProcessingRef.current) return;
 isProcessingRef.current = true;
 setIsProcessing(true);
 try {
 const isCurrentlyActive = (currentStatus || '').toLowerCase() === 'active';
 const newStatus = isCurrentlyActive ? 'paused' : 'active';
 const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some(p => p.id === adId);

 if (isMock) {
 updateLocalPromos(prev => prev.map(a => a.id === adId ? { ...a, status: newStatus } : a));
 toast({ title: 'تعديل حالة الإعلان الملاحي', description: `الحملة الآن: ${newStatus === 'active' ? 'نشطة ●' : 'موقوفة مؤقتاً ||'}.` });
 } else {
 try {
 const adRef = doc(db, 'promos', adId);
 await updateDoc(adRef, { status: newStatus });
 toast({ title: 'تعديل حالة الإعلان الملاحي', description: `الحملة الآن: ${newStatus === 'active' ? 'نشطة ●' : 'موقوفة مؤقتاً ||'}.` });
 } catch (fbError) {
 console.warn("Firebase update status failed, falling back to local:", fbError);
 updateLocalPromos(prev => {
 const existing = prev.find(a => a.id === adId);
 if (existing) {
 return prev.map(a => a.id === adId ? { ...a, status: newStatus } : a);
 } else {
 const dbAd = dbPromos.find(a => a.id === adId);
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
 }, [localPromos, dbPromos, toast, updateLocalPromos]);

 // 2. حذف / أرشفة (Delete)
 const deleteAd = useCallback(async (adId: string) => {
 if (isProcessingRef.current) return;
 isProcessingRef.current = true;
 setIsProcessing(true);
 try {
 const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some(p => p.id === adId);
 if (isMock) {
 updateLocalPromos(prev => prev.map(a => a.id === adId ? { ...a, status: 'archived' } : a));
 toast({ title: tAuto('campaignArchived') });
 } else {
 try {
 const adRef = doc(db, 'promos', adId);
 await updateDoc(adRef, { status: 'archived' });
 toast({ title: tAuto('campaignArchived') });
 } catch (fbError) {
 console.warn("Firebase delete failed, falling back to local:", fbError);
 updateLocalPromos(prev => {
 const existing = prev.find(a => a.id === adId);
 if (existing) {
 return prev.map(a => a.id === adId ? { ...a, status: 'archived' } : a);
 } else {
 const dbAd = dbPromos.find(a => a.id === adId);
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
 }, [localPromos, dbPromos, toast, updateLocalPromos, tAuto]);

 // 3. تجميد العقد (Freeze)
 const freezeAd = useCallback(async (adId: string, isFrozen: boolean) => {
 if (isProcessingRef.current) return;
 isProcessingRef.current = true;
 setIsProcessing(true);
 try {
 const targetStatus = isFrozen ? 'active' : 'frozen';
 const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some(p => p.id === adId);
 if (isMock) {
 updateLocalPromos(prev => prev.map(a => a.id === adId ? { ...a, status: targetStatus } : a));
 toast({ title: isFrozen ? tAuto('campaignActivated') : tAuto('campaignPausedTemp') });
 } else {
 try {
 const adRef = doc(db, 'promos', adId);
 await updateDoc(adRef, { status: targetStatus });
 toast({ title: isFrozen ? tAuto('campaignActivated') : tAuto('campaignPausedTemp') });
 } catch (fbError) {
 console.warn("Firebase freeze failed, falling back to local:", fbError);
 updateLocalPromos(prev => {
 const existing = prev.find(a => a.id === adId);
 if (existing) {
 return prev.map(a => a.id === adId ? { ...a, status: targetStatus } : a);
 } else {
 const dbAd = dbPromos.find(a => a.id === adId);
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
 }, [localPromos, dbPromos, toast, updateLocalPromos, tAuto]);

 // 4. تمديد التاريخ والظهور (Extend)
 const extendAd = useCallback(async (adId: string, extraImpressions: number, extraDays: number) => {
 if (isProcessingRef.current) return;
 isProcessingRef.current = true;
 setIsProcessing(true);
 try {
 const adDoc = ads.find(a => a.id === adId);
 const currentTarget = adDoc?.targetImpressions || 10000;
 const currentEndDate = adDoc?.endDate ? new Date(adDoc.endDate) : new Date();
 currentEndDate.setDate(currentEndDate.getDate() + extraDays);
 const newEndDateStr = currentEndDate.toISOString().split('T')[0];

 const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some(p => p.id === adId);
 if (isMock) {
 updateLocalPromos(prev => prev.map(a => a.id === adId ? {
 ...a,
 targetImpressions: currentTarget + extraImpressions,
 endDate: newEndDateStr
 } : a));
 toast({ title: tAuto('campaignCapacityExtended') });
 } else {
 try {
 const adRef = doc(db, 'promos', adId);
 await updateDoc(adRef, {
 targetImpressions: currentTarget + extraImpressions,
 endDate: newEndDateStr
 });
 toast({ title: tAuto('campaignCapacityExtended') });
 } catch (fbError) {
 console.warn("Firebase extend failed, falling back to local:", fbError);
 updateLocalPromos(prev => {
 const existing = prev.find(a => a.id === adId);
 if (existing) {
 return prev.map(a => a.id === adId ? {
 ...a,
 targetImpressions: currentTarget + extraImpressions,
 endDate: newEndDateStr
 } : a);
 } else {
 const dbAd = dbPromos.find(a => a.id === adId);
 if (dbAd) {
 return [...prev, {
 ...dbAd,
 targetImpressions: currentTarget + extraImpressions,
 endDate: newEndDateStr
 }];
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
 }, [ads, localPromos, dbPromos, toast, updateLocalPromos, tAuto]);

 const approveAd = useCallback(async (adId: string) => {
 if (isProcessingRef.current) return;
 isProcessingRef.current = true;
 setIsProcessing(true);
 try {
 const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some(p => p.id === adId);
 if (isMock) {
 updateLocalPromos(prev => prev.map(a => a.id === adId ? { ...a, status: 'active', isSovereignStopped: false, rejectionReason: '' } : a));
 toast({ title: tAuto('adApproved'), description: tAuto('adPublished') });
 } else {
 try {
 const adRef = doc(db, 'promos', adId);
 await updateDoc(adRef, { status: 'active', isSovereignStopped: false, rejectionReason: '' });
 toast({ title: tAuto('adApproved'), description: tAuto('adPublished') });
 } catch (fbError) {
 console.warn("Firebase approve failed, falling back to local:", fbError);
 updateLocalPromos(prev => {
 const existing = prev.find(a => a.id === adId);
 if (existing) {
 return prev.map(a => a.id === adId ? { ...a, status: 'active', isSovereignStopped: false, rejectionReason: '' } : a);
 } else {
 const dbAd = dbPromos.find(a => a.id === adId);
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
 }, [localPromos, dbPromos, toast, updateLocalPromos, tAuto]);

 const rejectAd = useCallback(async (adId: string, reason: string) => {
 if (!reason.trim()) {
 toast({ variant: 'destructive', title: tAuto('actionRejected'), description: tAuto('rejectionReasonRequired') });
 return;
 }
 if (isProcessingRef.current) return;
 isProcessingRef.current = true;
 setIsProcessing(true);
 try {
 const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some(p => p.id === adId);
 if (isMock) {
 updateLocalPromos(prev => prev.map(a => a.id === adId ? { ...a, status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason } : a));
 toast({ title: tAuto('adRejected'), description: tAuto('rejectionReasonSaved') });
 } else {
 try {
 const adRef = doc(db, 'promos', adId);
 await updateDoc(adRef, { status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason });
 toast({ title: tAuto('adRejected'), description: tAuto('rejectionReasonSaved') });
 } catch (fbError) {
 console.warn("Firebase reject failed, falling back to local:", fbError);
 updateLocalPromos(prev => {
 const existing = prev.find(a => a.id === adId);
 if (existing) {
 return prev.map(a => a.id === adId ? { ...a, status: 'REJECTED', isSovereignStopped: true, rejectionReason: reason } : a);
 } else {
 const dbAd = dbPromos.find(a => a.id === adId);
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
 }, [localPromos, dbPromos, toast, updateLocalPromos, tAuto]);

 // 🛡️ [RAD-MAP-076-KILL-SWITCH] executeAdAnnihilation (Digital Annihilation)
 const executeAdAnnihilation = useCallback(async (adId: string, reason: string) => {
 if (!reason.trim()) {
 toast({ variant: 'destructive', title: tAuto('couldNotStopAd'), description: tAuto('stopReasonRequired') });
 return false;
 }
 if (isProcessingRef.current) return false;
 isProcessingRef.current = true;
 setIsProcessing(true);
 try {
 const isMock = adId.startsWith('promo-') || adId.startsWith('mock-') || localPromos.some(p => p.id === adId);
 if (isMock) {
 updateLocalPromos(prev => prev.map(a => a.id === adId ? { ...a, status: 'REJECTED', isSovereignStopped: true, rejectionReason: tAuto('adStoppedReason', { reason }) } : a));
 toast({
 title: tAuto('adStopped'),
 description: tAuto('adStoppedAlertSent')
 });
 } else {
 try {
 const adRef = doc(db, 'promos', adId);

 // 1. Update Firestore state
 await updateDoc(adRef, {
 status: 'REJECTED',
 isSovereignStopped: true,
 rejectionReason: tAuto('adStoppedReason', { reason })
 });

 // 2. Broadcast Silent Web Push for immediate local cache purge
 await broadcastSilentPush({
 type: 'PURGE_AD',
 targetId: adId,
 message: tAuto('adStoppedPushMessage', { adId, reason })
 });

 toast({
 title: tAuto('adStopped'),
 description: tAuto('adStoppedAlertSent')
 });
 } catch (fbError) {
 console.warn("Firebase execution failed, falling back to local:", fbError);
 updateLocalPromos(prev => {
 const existing = prev.find(a => a.id === adId);
 if (existing) {
 return prev.map(a => a.id === adId ? { ...a, status: 'REJECTED', isSovereignStopped: true, rejectionReason: `[إيقاف الإعلان]: ${reason}` } : a);
 } else {
 const dbAd = dbPromos.find(a => a.id === adId);
 if (dbAd) {
 return [...prev, { ...dbAd, status: 'REJECTED', isSovereignStopped: true, rejectionReason: `[إيقاف الإعلان]: ${reason}` }];
 }
 }
 return prev;
 });
 toast({
 title: 'تم إيقاف الإعلان محلياً',
 description: 'تم إيقاف عرض الإعلان محلياً.'
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
 }, [localPromos, dbPromos, toast, updateLocalPromos]);

 return { ads, isLoading, isProcessing, createAd, toggleAdStatus, deleteAd, freezeAd, extendAd, approveAd, rejectAd, executeAdAnnihilation };
}
