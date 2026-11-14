import type { AppLanguage } from '@/lib/i18n/simple-copy';

export const styles = {
  root: 'fixed inset-y-0 start-0 z-[140] hidden w-[288px] flex-col border-e border-white/[0.06] bg-[#0A0F1D]/95 shadow-[22px_0_70px_rgba(0,0,0,0.38)] backdrop-blur-xl lg:flex',
  header: 'flex items-center gap-2 border-b border-white/[0.08] bg-[#060B18] px-5 py-4',
  brandLogo: 'h-6 w-auto object-contain',
  brandTitle: 'text-sm font-black text-white tracking-wide',
  profile: 'flex items-center gap-3 border-b border-white/10 p-5',
  avatar: 'h-12 w-12 border border-[#14B8A6]/35 bg-[#101827]',
  avatarFallback: 'bg-[#101827] text-sm font-black text-white',
  identity: 'min-w-0 flex-1',
  identityRtl: 'text-right',
  identityLtr: 'text-left',
  name: 'truncate text-sm font-black text-white',
  phone: 'truncate text-xs font-bold text-[#14B8A6]',
  language: 'ms-auto h-8 shrink-0 gap-1 rounded-lg border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-2 text-[10px] font-black text-[#14F5D5] hover:bg-[#14B8A6]/20 hover:text-[#14F5D5]',
  languageIcon: 'h-3.5 w-3.5',
  taglineCard: 'mx-4 my-2.5 rounded-xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-2 text-center',
  taglineText: 'text-[11px] font-bold leading-snug text-[#14F5D5]',
  actionCard: 'px-4 py-2',
  actionBox: 'rounded-2xl border border-white/10 bg-[#060B18]/90 p-3 shadow-lg shadow-black/25',
  actionSectorTitle: 'text-center text-xs font-bold text-slate-300 mb-2',
  request: 'h-11 w-full justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14B8A6] via-[#14F5D5] to-[#14B8A6] text-sm font-black text-slate-950 shadow-[0_0_20px_rgba(20,245,213,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
  actionIcon: 'h-4 w-4',
  navigation: 'flex-1 space-y-1.5 px-4 pt-2 overflow-y-auto',
  navItem: 'flex h-11 items-center justify-between rounded-xl border px-3.5 text-sm font-black transition',
  navActive: 'border-[#14B8A6]/35 bg-[#14B8A6]/15 text-[#14F5D5]',
  navIdle: 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white',
  navIcon: 'h-5 w-5',
  footer: 'space-y-3 border-t border-white/10 p-4 shrink-0',
  logout: 'h-11 w-full justify-center gap-2 rounded-xl bg-red-600/90 text-sm font-black text-white hover:bg-red-500',
} as const;

export const desktopSidebarCopy = {
  ar: {
    fallbackName: 'مستخدم',
    fallbackPhone: 'تطبيق الرحلات',
    logout: 'تسجيل الخروج',
    nav: {
      notifications: 'إشعارات المشرف',
      home: 'الرئيسية',
      history: 'سجلاتي',
      vault: 'الخزنة',
      profile: 'حسابي',
    },
    captainSector: 'قطاع إعلانات الكباتن',
    requestRide: 'ابحث واطلب',
    tagline: 'ابحث عن عروض الكباتن المعلنين في محيطك واختار العرض المناسب',
    brandTitle: 'شبكة بينكم للإعلان الرقمي',
  },
  en: {
    fallbackName: 'Rider',
    fallbackPhone: 'Ride app',
    logout: 'Log out',
    nav: {
      notifications: 'Admin Notices',
      home: 'Home',
      history: 'My Records',
      vault: 'Vault',
      profile: 'Profile',
    },
    captainSector: 'Captain Ads Sector',
    requestRide: 'Search & Request',
    tagline: 'Search for advertiser captains in your area and choose the best offer',
    brandTitle: 'Bynkcom Digital Ad Network',
  },
} satisfies Record<AppLanguage, {
  fallbackName: string;
  fallbackPhone: string;
  logout: string;
  nav: Record<'notifications' | 'home' | 'history' | 'profile' | 'vault', string>;
  captainSector: string;
  requestRide: string;
  tagline: string;
  brandTitle: string;
}>;

export function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0]?.[0] || ''}${words[1]?.[0] || ''}`.toUpperCase();
  return value.slice(0, 2).toUpperCase();
}
