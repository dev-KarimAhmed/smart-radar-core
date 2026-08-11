'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Heart, MessageCircle, Phone, Trash2, ShieldCheck, HelpCircle } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

import { cn } from '@/lib/utils';
const styles = {
  style112_1: "w-full max-w-4xl mx-auto px-4 pb-12 font-sans",
  style112_2: "text-right",
  style112_3: "text-left",
  style114_4: "bg-[#051510] border border-emerald-500/20 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4",
  style115_5: "flex items-center gap-3",
  style116_6: "w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400",
  style117_7: "w-6 h-6",
  style119_8: "text-right",
  style119_9: "text-left",
  style120_10: "text-sm font-black text-[#00ffcc] tracking-wide",
  style121_11: "text-[10px] text-gray-400",
  style124_12: "text-xs bg-black/45 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-emerald-400 font-extrabold shrink-0",
  style131_13: "bg-neutral-900/35 border border-white/5 text-center py-16 px-6 rounded-2xl flex flex-col items-center justify-center gap-4",
  style132_14: "w-12 h-12 rounded-full bg-neutral-950 flex items-center justify-center border border-white/5 text-gray-500",
  style133_15: "w-6 h-6",
  style135_16: "space-y-1",
  style136_17: "text-sm font-bold text-white",
  style137_18: "text-xs text-gray-400 max-w-xs leading-relaxed mx-auto",
  style143_19: "grid grid-cols-1 md:grid-cols-2 gap-4",
  style153_20: "bg-neutral-950/60 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/10 transition-all duration-300 space-y-4 relative overflow-hidden",
  style156_21: "flex gap-4 items-start",
  style157_22: "w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10",
  style161_23: "w-full h-full object-cover",
  style165_24: "flex-1 space-y-1",
  style165_25: "text-right",
  style165_26: "text-left",
  style166_27: "text-sm font-black text-white line-clamp-1",
  style169_28: "text-[11px] text-gray-400 line-clamp-2 leading-relaxed",
  style172_29: "flex flex-wrap gap-1.5 pt-1",
  style173_30: "inline-block bg-emerald-950/70 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-950",
  style181_31: "p-1 text-rose-500/70 hover:text-rose-400 transition-all",
  style184_32: "w-4 h-4",
  style189_33: "bg-black/50 p-2.5 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px]",
  style190_34: "text-gray-400 font-sans",
  style191_35: "text-emerald-400",
  style191_36: "text-amber-400 animate-pulse",
  style197_37: "px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00ffcc] font-black border border-emerald-500/20 rounded-lg cursor-pointer transition-all active:scale-95 text-[9px]",
  style204_38: "grid grid-cols-2 gap-2 pt-1",
  style213_39: "h-10 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-emerald-500/20",
  style215_40: "w-4 h-4",
  style227_41: "h-10 bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-500/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95",
  style229_42: "w-4 h-4",
} as const;


export function VaultTab() {
 const { isArabic, language } = useDashboardLanguage();
 const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
 const [vaultDetails, setVaultDetails] = useState<Record<string, any>>({});
 const copy = vaultCopy[language];

 useEffect(() => {
 try {
 const stored = localStorage.getItem('sovereign_hearted_ads');
 const details = localStorage.getItem('sovereign_ad_vault_details');
 const now = Date.now();

 if (stored && details) {
 let heartedIds: string[] = JSON.parse(stored);
 let detailsDict = JSON.parse(details);
 let changed = false;

 // [SCR-AD-VAULT-130] Auto-purge items older than 20 days with sovereign safety limit
 const activeIds = heartedIds.filter((id) => {
 const ad = detailsDict[id];
 if (ad) {
 const savedTime = ad.savedAtTimestamp || now;
 const isExpired = now - savedTime > 20 * 24 * 60 * 60 * 1000;
 if (isExpired) {
 delete detailsDict[id];
 changed = true;
 return false;
 }
 }
 return true;
 });

 if (changed) {
 localStorage.setItem('sovereign_hearted_ads', JSON.stringify(activeIds));
 localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(detailsDict));
 setHeartedAdIds(activeIds);
 setVaultDetails(detailsDict);
 } else {
 setHeartedAdIds(heartedIds);
 setVaultDetails(detailsDict);
 }
 } else if (stored) {
 setHeartedAdIds(JSON.parse(stored));
 }
 } catch (e) {
 console.error('Failed to read sovereign ad vault localStorage contents:', e);
 }
 }, []);

 const savedAds = useMemo(() => {
 return [...heartedAdIds]
 .reverse()
 .map((id) => vaultDetails[id])
 .filter(Boolean);
 }, [heartedAdIds, vaultDetails]);

 const handleDelete = (adId: string) => {
 const nextIds = heartedAdIds.filter((id) => id !== adId);
 setHeartedAdIds(nextIds);
 localStorage.setItem('sovereign_hearted_ads', JSON.stringify(nextIds));

 const nextDetails = { ...vaultDetails };
 delete nextDetails[adId];
 setVaultDetails(nextDetails);
 localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(nextDetails));

 // Optional haptic
 if (typeof navigator !== 'undefined' && navigator.vibrate) {
 navigator.vibrate(30);
 }
 };

 // [SCR-AD-VAULT-130] Handlers for resetting local safety life clock
 const handleExtend = (adId: string) => {
 const nextDetails = { ...vaultDetails };
 if (nextDetails[adId]) {
 nextDetails[adId] = {
 ...nextDetails[adId],
 savedAtTimestamp: Date.now()
 };
 setVaultDetails(nextDetails);
 localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(nextDetails));

 if (typeof navigator !== 'undefined' && navigator.vibrate) {
 navigator.vibrate([40, 40]);
 }
 alert(copy.extendAlert);
 }
 };

 const handleZeroClickAction = (actionType: 'call' | 'whatsapp', contactNumber: string, title?: string) => {
 let url = '';
 const cleanNum = contactNumber.replace(/[^0-9+]/g, '');
 if (actionType === 'whatsapp') {
 const text = encodeURIComponent(
 copy.whatsappMessage(title || '')
 );
 url = `https://wa.me/${cleanNum}?text=${text}`;
 } else {
 url = `tel:${cleanNum}`;
 }
 window.open(url, '_blank');
 };

 return (
 <div className={cn(styles.style112_1, isArabic ? styles.style112_2 : styles.style112_3)} dir={isArabic ? 'rtl' : 'ltr'}>
 {/* Header Info Banner */}
 <div className={styles.style114_4}>
 <div className={styles.style115_5}>
 <div className={styles.style116_6}>
 <ShieldCheck className={styles.style117_7} />
 </div>
 <div className={isArabic ? styles.style119_8 : styles.style119_9}>
 <h3 className={styles.style120_10}>{copy.title}</h3>
 <p className={styles.style121_11}>{copy.subtitle}</p>
 </div>
 </div>
 <div className={styles.style124_12}>
 {copy.count(heartedAdIds.length)}
 </div>
 </div>

 {/* Main List */}
 {savedAds.length === 0 ? (
 <div className={styles.style131_13}>
 <div className={styles.style132_14}>
 <HelpCircle className={styles.style133_15} />
 </div>
 <div className={styles.style135_16}>
 <p className={styles.style136_17}>{copy.emptyTitle}</p>
 <p className={styles.style137_18}>
 {copy.emptyDescription}
 </p>
 </div>
 </div>
 ) : (
 <div className={styles.style143_19}>
 {savedAds.map((ad: any) => {
 const savedTime = ad.savedAtTimestamp || Date.now();
 const daysLeft = Math.ceil(
 (savedTime + 20 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)
 );

 return (
 <div
 key={ad.id}
 className={styles.style153_20}
 >
 {/* Visual Cover row */}
 <div className={styles.style156_21}>
 <div className={styles.style157_22}>
 <img
 src={ad.content?.posterUrl || ad.bannerUrl || 'https://via.placeholder.com/150'}
 alt={ad.content?.title || ad.title}
 className={styles.style161_23}
 referrerPolicy="no-referrer"
 />
 </div>
 <div className={cn(styles.style165_24, isArabic ? styles.style165_25 : styles.style165_26)}>
 <h4 className={styles.style166_27}>
 {ad.content?.title || ad.title}
 </h4>
 <p className={styles.style169_28}>
 {ad.content?.description || ad.description}
 </p>
 <div className={styles.style172_29}>
 <span className={styles.style173_30}>
 {copy.area}: {ad.targetDistrict || copy.unknownArea}
 </span>
 </div>
 </div>

 <button
 onClick={() => handleDelete(ad.id)}
 className={styles.style181_31}
 title={copy.deleteTitle}
 >
 <Trash2 className={styles.style184_32} />
 </button>
 </div>

 {/* Expiration warning and storage controls */}
 <div className={styles.style189_33}>
 <span className={styles.style190_34}>
 {copy.savedFor}: <strong className={daysLeft > 7 ? styles.style191_35 : styles.style191_36}>
 {daysLeft > 0 ? copy.daysLeft(daysLeft) : copy.expiresToday}
 </strong>
 </span>
 <button
 onClick={() => handleExtend(ad.id)}
 className={styles.style197_37}
 >
 {copy.extend}
 </button>
 </div>

 {/* Direct Connect Buttons */}
 <div className={styles.style204_38}>
 <button
 onClick={() =>
 handleZeroClickAction(
 'whatsapp',
 ad.whatsapp || ad.advertiserData?.whatsapp || '962790000000',
 ad.content?.title || ad.title
 )
 }
 className={styles.style213_39}
 >
 <MessageCircle className={styles.style215_40} />
 <span>{copy.whatsapp}</span>
 </button>

 <button
 onClick={() =>
 handleZeroClickAction(
 'call',
 ad.phone || ad.advertiserData?.phone || '0790000000',
 ad.content?.title || ad.title
 )
 }
 className={styles.style227_41}
 >
 <Phone className={styles.style229_42} />
 <span>{copy.call}</span>
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}

const vaultCopy = {
 ar: {
 area: 'المنطقة',
 call: 'اتصال هاتفي',
 count: (count: number) => `محفوظاتك: (${count})`,
 daysLeft: (days: number) => `متبقي ${days} يوم`,
    deleteTitle: 'حذف من الخزنة',
 emptyDescription: 'اضغط على أيقونة القلب في أي إعلان لحفظه هنا والرجوع إليه لاحقاً.',
 emptyTitle: 'لا توجد إعلانات محفوظة حالياً',
 expiresToday: 'ينتهي اليوم',
 extend: 'تمديد الحفظ 20 يوماً',
 extendAlert: 'تم تمديد حفظ الإعلان لمدة 20 يوماً إضافية.',
 savedFor: 'مدة الحفظ',
 subtitle: 'تظهر هنا الإعلانات التي حفظتها لمدة 20 يوماً.',
 title: 'الإعلانات المحفوظة',
 unknownArea: 'غير محدد',
 whatsapp: 'واتساب مباشر',
 whatsappMessage: (title: string) => `مرحباً، شاهدت إعلانكم "${title}" وأود معرفة تفاصيل العرض.`,
 },
 en: {
 area: 'Area',
 call: 'Phone call',
 count: (count: number) => `Vault: (${count})`,
 daysLeft: (days: number) => `${days} days left`,
 deleteTitle: 'Remove from vault',
 emptyDescription: 'Tap the heart icon on any ad to save it here and return to it later.',
 emptyTitle: 'No vault ads yet',
 expiresToday: 'Expires today',
 extend: 'Extend for 20 days',
 extendAlert: 'The ad was saved for 20 more days.',
 savedFor: 'Stored for',
 subtitle: 'Ads you add to the Vault appear here for 20 days.',
 title: 'Vault ads',
 unknownArea: 'Not set',
 whatsapp: 'WhatsApp',
 whatsappMessage: (title: string) => `Hello, I saw your ad "${title}" and would like to know more about the offer.`,
 },
} as const;
