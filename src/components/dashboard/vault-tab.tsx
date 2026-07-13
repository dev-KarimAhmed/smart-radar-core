'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Heart, MessageCircle, Phone, Trash2, ShieldCheck, HelpCircle } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

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
 <div className={`w-full max-w-4xl mx-auto px-4 pb-12 font-sans ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
 {/* Header Info Banner */}
 <div className="bg-radar-forest-deep border border-emerald-500/20 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div className={isArabic ? 'text-right' : 'text-left'}>
 <h3 className="text-sm font-black text-radar-neon tracking-wide">{copy.title}</h3>
 <p className="text-[10px] text-gray-400">{copy.subtitle}</p>
 </div>
 </div>
 <div className="text-xs bg-black/45 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-emerald-400 font-extrabold shrink-0">
 {copy.count(heartedAdIds.length)}
 </div>
 </div>

 {/* Main List */}
 {savedAds.length === 0 ? (
 <div className="bg-neutral-900/35 border border-white/5 text-center py-16 px-6 rounded-2xl flex flex-col items-center justify-center gap-4">
 <div className="w-12 h-12 rounded-full bg-neutral-950 flex items-center justify-center border border-white/5 text-gray-500">
 <HelpCircle className="w-6 h-6" />
 </div>
 <div className="space-y-1">
 <p className="text-sm font-bold text-white">{copy.emptyTitle}</p>
 <p className="text-xs text-gray-400 max-w-xs leading-relaxed mx-auto">
 {copy.emptyDescription}
 </p>
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {savedAds.map((ad: any) => {
 const savedTime = ad.savedAtTimestamp || Date.now();
 const daysLeft = Math.ceil(
 (savedTime + 20 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)
 );

 return (
 <div
 key={ad.id}
 className="bg-neutral-950/60 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/10 transition-all duration-300 space-y-4 relative overflow-hidden"
 >
 {/* Visual Cover row */}
 <div className="flex gap-4 items-start">
 <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
 <img
 src={ad.content?.posterUrl || ad.bannerUrl || 'https://via.placeholder.com/150'}
 alt={ad.content?.title || ad.title}
 className="w-full h-full object-cover"
 referrerPolicy="no-referrer"
 />
 </div>
 <div className={`flex-1 space-y-1 ${isArabic ? 'text-right' : 'text-left'}`}>
 <h4 className="text-sm font-black text-white line-clamp-1">
 {ad.content?.title || ad.title}
 </h4>
 <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
 {ad.content?.description || ad.description}
 </p>
 <div className="flex flex-wrap gap-1.5 pt-1">
 <span className="inline-block bg-emerald-950/70 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-950">
 {copy.area}: {ad.targetDistrict || copy.unknownArea}
 </span>
 </div>
 </div>

 <button
 onClick={() => handleDelete(ad.id)}
 className="p-1 text-rose-500/70 hover:text-rose-400 transition-all"
 title={copy.deleteTitle}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>

 {/* Expiration warning and storage controls */}
 <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px]">
 <span className="text-gray-400 font-sans">
 {copy.savedFor}: <strong className={daysLeft > 7 ? "text-emerald-400" : "text-amber-400 animate-pulse"}>
 {daysLeft > 0 ? copy.daysLeft(daysLeft) : copy.expiresToday}
 </strong>
 </span>
 <button
 onClick={() => handleExtend(ad.id)}
 className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-radar-neon font-black border border-emerald-500/20 rounded-lg cursor-pointer transition-all active:scale-95 text-[9px]"
 >
 {copy.extend}
 </button>
 </div>

 {/* Direct Connect Buttons */}
 <div className="grid grid-cols-2 gap-2 pt-1">
 <button
 onClick={() =>
 handleZeroClickAction(
 'whatsapp',
 ad.whatsapp || ad.advertiserData?.whatsapp || '962790000000',
 ad.content?.title || ad.title
 )
 }
 className="h-10 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-emerald-500/20"
 >
 <MessageCircle className="w-4 h-4" />
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
 className="h-10 bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-500/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
 >
 <Phone className="w-4 h-4" />
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
 deleteTitle: 'حذف من المحفوظات',
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
 count: (count: number) => `Saved: (${count})`,
 daysLeft: (days: number) => `${days} days left`,
 deleteTitle: 'Remove from saved',
 emptyDescription: 'Tap the heart icon on any ad to save it here and return to it later.',
 emptyTitle: 'No saved ads yet',
 expiresToday: 'Expires today',
 extend: 'Extend for 20 days',
 extendAlert: 'The ad was saved for 20 more days.',
 savedFor: 'Saved for',
 subtitle: 'Ads you save appear here for 20 days.',
 title: 'Saved ads',
 unknownArea: 'Not set',
 whatsapp: 'WhatsApp',
 whatsappMessage: (title: string) => `Hello, I saw your ad "${title}" and would like to know more about the offer.`,
 },
} as const;
