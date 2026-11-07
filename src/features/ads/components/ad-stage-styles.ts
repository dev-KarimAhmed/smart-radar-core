import { PLACEHOLDER_BANNER_URL } from '../services/ad-stage-media';
import type { AdAudience } from '../services/ad-audience';

export const styles = {
  style384_1: "relative",
  style384_2: "m-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#14B8A6]/50 bg-[#0B0F19]",
  style385_3: "mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-[#14B8A6]",
  style386_4: "px-4 text-center text-sm font-bold tracking-widest text-[#14B8A6]",
  style389_5: "text-xs text-gray-400",
  style398_6: "relative z-[10] flex w-full flex-col justify-center items-center overflow-hidden border-b border-white/5 bg-[#0B0F19] pt-0 pb-2 pointer-events-auto select-none sm:py-2",
  style400_7: "justify-center items-center",
  style400_8: "justify-center items-center",
  style405_9: "sticky top-0 z-[40] mb-2 flex shrink-0 items-center justify-center w-full px-3 py-2 sm:px-6 sm:py-3 border-b border-[#14B8A6]/20 bg-[#0B0F19]/95 backdrop-blur-md lg:hidden",
  style423_10: "group flex min-h-[48px] sm:min-h-[56px] w-full max-w-[260px] sm:max-w-[300px] cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#14F5D5]/50 bg-gradient-to-r from-[#14B8A6] via-[#14F5D5] to-[#14B8A6] px-5 py-2.5 sm:px-7 sm:py-3.5 text-base sm:text-xl font-black !text-[#040914] shadow-[0_8px_24px_rgba(20,184,166,0.35)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_12px_32px_rgba(20,245,213,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14F5D5]",
  style429_11: "z-[20] mb-1 flex w-full shrink-0 items-center justify-between px-4 sm:mb-2 sm:px-6",
  style430_12: "flex items-center gap-2",
  style431_13: "relative flex h-2.5 w-2.5",
  style432_14: "absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14B8A6] opacity-75",
  style433_15: "relative inline-flex h-2.5 w-2.5 rounded-full bg-[#14B8A6]",
  style435_16: "text-xs font-black uppercase tracking-widest text-[#14F5D5] md:text-sm",
  style439_17: "font-mono text-[9px] font-bold text-gray-500 md:text-[10px]",
  style446_18: "group/river relative flex min-h-0 w-full flex-1 items-center justify-center pt-0 overflow-hidden",
  style446_19: "py-0 sm:py-0 h-full",
  style457_20: "absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:left-4",
  style459_21: "hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15",
  style460_22: "cursor-not-allowed opacity-35",
  style463_23: "h-5 w-5",
  style472_24: "absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:right-4",
  style474_25: "hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15",
  style475_26: "cursor-not-allowed opacity-35",
  style478_27: "h-5 w-5",
  style490_28: "no-scrollbar flex min-w-0 flex-1 flex-nowrap gap-6 sm:gap-8 overflow-x-auto items-center h-full",
  style491_29: "justify-center px-6 sm:px-16",
  style491_30: "px-14 lg:justify-center",
  style497_31: "flex-shrink-0 my-auto h-full flex items-center justify-center",
  style518_32: "fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black/85 p-0 backdrop-blur-sm md:p-4 md:justify-center",
  style526_33: "relative flex max-h-[92vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-[32px] border-t-2 border-[#14B8A6]/40 bg-[#070D19] px-6 pt-6 pb-28 shadow-[0_-12px_45px_rgba(20,184,166,0.25)] md:rounded-[32px] md:border-x-2 md:p-6",
  style534_34: "absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#0B0F19]/90 text-white shadow-xl shadow-black/35 backdrop-blur-md transition hover:border-red-400/40 hover:bg-red-950/70",
  style536_35: "h-5 w-5",
  style539_36: "mx-auto mb-1 h-1 w-12 rounded-full bg-[#14B8A6]/30",
  style541_37: "flex items-center justify-between border-b border-white/5 pb-3 pe-12",
  style542_38: "flex items-center gap-2 text-xs font-black text-[#14F5D5]",
  style543_39: "h-4 w-4 animate-pulse text-[#14F5D5]",
  style551_40: "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black transition-all duration-300",
  style553_41: "border-rose-400/40 bg-rose-500/15 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.22)]",
  style554_42: "border-[#14B8A6]/25 bg-[#14B8A6]/10 text-[#14F5D5] hover:bg-[#14B8A6]/15",
  style560_43: "h-4 w-4 transition-transform duration-300",
  style561_44: "scale-110 fill-rose-300 text-rose-300",
  style573_45: "space-y-2",
  style573_46: "text-right",
  style573_47: "text-left",
  style574_48: "rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-1 text-[10px] font-black text-[#14F5D5]",
  style577_49: "mt-2 text-xl font-black leading-tight text-white",
  style580_50: "pt-1 text-xs leading-relaxed text-gray-300",
  style585_51: "mt-1.5 flex flex-col gap-3",
  style590_52: "flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#00cc66]/50 bg-[#00cc66] p-3.5 text-xs font-black text-white shadow-[0_4px_15px_rgba(0,204,102,0.25)] transition hover:bg-[#00e271]",
  style592_53: "h-4 w-4 text-white",
  style599_54: "flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#14B8A6]/35 bg-[#131C31] p-3.5 text-xs font-black text-[#14F5D5] shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition hover:bg-[#14B8A6]/15",
  style601_55: "h-4 w-4 text-[#14F5D5]",
  style609_56: "flex w-full items-center justify-center gap-2.5 rounded-2xl border border-blue-700/50 bg-blue-700 p-3.5 text-xs font-black text-white shadow-[0_4px_15px_rgba(29,78,216,0.25)] transition hover:bg-blue-600",
  style611_57: "h-4 w-4 text-white",
  style629_58: "relative overflow-hidden rounded-3xl border border-white/10 bg-[#0B0F19] shadow-[0_18px_40px_rgba(0,0,0,0.35)]",
  style632_59: "aspect-video w-full bg-black object-cover",
  style644_60: "aspect-video w-full bg-[#07101F] object-cover",
  stageFull: "h-full w-full flex-1 justify-center items-center min-h-[calc(100vh-7.5rem)]",
  stageCompact: "h-[280px] w-full sm:h-[320px]",
  cardFull: "h-[calc(100vh-7.65rem)] min-h-[460px] w-[290px] sm:w-[350px] md:w-[400px] lg:w-[440px] max-w-[88vw]",
  cardCompact: "h-[216px] w-[270px] sm:h-[250px] sm:w-[280px] md:w-[340px]",
} as const;

export const AD_STAGE_COPY = {
  ar: {
    loadingTitle: 'جاري تحميل الإعلانات',
    loadingSubtitle: 'ثوانٍ من فضلك',
    title: 'إعلانات قريبة منك',
    count: (count: number) => `${count} إعلان`,
    riderBadge: 'للركاب',
    captainBadge: 'للكباتن',
    nearbyBadge: 'إعلان قريب',
    previous: 'الإعلان السابق',
    next: 'الإعلان التالي',
    noMoreAds: 'لا توجد إعلانات أخرى حالياً',
    trustedAd: 'إعلان موثق للتواصل المباشر',
    whatsapp: 'واتساب',
    call: 'اتصال',
    openLocation: 'فتح الموقع',
    whatsappMessage: (title: string) => `مرحباً، شاهدت إعلانكم في التطبيق: ${title}`,
    emptyTitle: 'مرحباً بك في منصة بينكم',
    emptyDescription: 'لا توجد إعلانات نشطة في منطقتك الآن. سنعرض لك العروض فور توفرها.',
    emptyFetchIssue: 'لا توجد إعلانات متاحة الآن. سنعرض لك العروض فور توفرها.',
    emptyButton: 'ابدأ رحلتك',
    emptyButtonRider: 'أعلن هنا',
    fallbackDistrict: 'عمّان',
    fallbackGovernorate: 'العاصمة',
  },
  en: {
    loadingTitle: 'Loading ads',
    loadingSubtitle: 'One moment please',
    title: 'Nearby ads',
    count: (count: number) => `${count} ad${count === 1 ? '' : 's'}`,
    riderBadge: 'For riders',
    captainBadge: 'For drivers',
    nearbyBadge: 'Nearby ad',
    previous: 'Previous ad',
    next: 'Next ad',
    noMoreAds: 'No other ads right now',
    trustedAd: 'Verified ad for direct contact',
    favorite: 'Favorite',
    removeFavorite: 'Remove favorite',
    whatsapp: 'WhatsApp',
    call: 'Call',
    openLocation: 'Open location',
    whatsappMessage: (title: string) => `Hello, I saw your ad in the app: ${title}`,
    emptyTitle: 'Welcome to bynkcom',
    emptyDescription: 'No active ads are available in your area right now. We will show offers as soon as they are available.',
    emptyFetchIssue: 'No ads are available right now. We will show offers as soon as they are available.',
    emptyButton: 'Start your ride',
    emptyButtonRider: 'Advertise here',
    fallbackDistrict: 'Amman',
    fallbackGovernorate: 'Capital',
  },
} as const;

export type AdStageCopy = (typeof AD_STAGE_COPY)['ar' | 'en'];

export function filterAdsByLocalContext(userDistrict: string, userGovernorate: string, allAds: any[]) {
  return allAds.filter((ad) => {
    if (!ad || !ad.targetScale) return true;
    if (ad.targetScale === 'Governorate') return ad.targetLocationName === userGovernorate;
    if (ad.targetScale === 'District') return ad.targetLocationName === userDistrict;
    return true;
  });
}

export function buildBrandPlaceholderAd(
  copy: AdStageCopy,
  description: string = copy.emptyDescription,
  audience?: AdAudience
) {
  const isRider = audience === 'rider';
  return {
    id: 'brand-empty-state',
    title: copy.emptyTitle,
    description,
    bannerUrl: PLACEHOLDER_BANNER_URL,
    buttonText: isRider ? copy.emptyButtonRider : copy.emptyButton,
    content: {
      title: copy.emptyTitle,
      description,
    },
    isPlaceholder: true,
  };
}

export function getBadgeText(ad: any, copy: AdStageCopy) {
  if (ad.adType === 'RIDER_BENEFIT') return copy.riderBadge;
  if (ad.adType === 'CAPTAIN_PROFESSIONAL') return copy.captainBadge;
  return copy.nearbyBadge;
}
