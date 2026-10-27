'use client';

import React from 'react';
import Image from 'next/image';
import { Archive, Bell, Download, History, Home, Languages, LogOut, PlusCircle, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { cn } from '@/lib/utils';
import { useTranslations } from "next-intl";
import { useNotifications } from '@/shared/hooks/use-notifications';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { SovereignPwaInstallModal } from '@/components/sovereign-pwa-install-modal';

const styles = {
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

const copy = {
  ar: {
    fallbackName: 'مستخدم',
    fallbackPhone: 'تطبيق الرحلات',
    logout: 'تسجيل الخروج',
    nav: {
      notifications: 'التنبيهات',
      home: 'الرئيسية',
      history: 'سجلي مع معلن',
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
      notifications: 'Notifications',
      home: 'Home',
      history: 'My Log with Advertiser',
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

function initials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0]?.[0] || ''}${words[1]?.[0] || ''}`.toUpperCase();
  return value.slice(0, 2).toUpperCase();
}

export function DesktopRiderSidebar({
  hash,
  language,
  logout,
  onNotify,
  user,
  isCritical = false,
  isRideFlowActive = false,
}: {
  hash: string;
  language: AppLanguage;
  logout: () => void | Promise<void>;
  onNotify: () => void;
  user: { name?: string; phone?: string };
  isCritical?: boolean;
  isRideFlowActive?: boolean;
}) {
  const tAuto = useTranslations('auto');
  const { isArabic, toggleLanguage } = useDashboardLanguage();
  const { hasUnread, unreadCount } = useNotifications();
  const { canShowInstallButton, canPromptNative, triggerNativeInstall } = usePwaInstall('rider');
  const [isInstallModalOpen, setIsInstallModalOpen] = React.useState(false);
  const text = copy[language];
  const directionClass = language === 'ar' ? styles.identityRtl : styles.identityLtr;

  const items = [
    {
      href: '#notifications',
      icon: Bell,
      label: text.nav.notifications,
      badge: hasUnread ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.hash = '#notifications';
        onNotify();
      },
    },
    { href: '#', icon: Home, label: text.nav.home },
    { href: '#history', icon: History, label: text.nav.history },
    { href: '#vault', icon: Archive, label: text.nav.vault },
    { href: '#profile', icon: User, label: text.nav.profile },
  ];

  const [isFlowActive, setIsFlowActive] = React.useState(Boolean(isRideFlowActive));

  React.useEffect(() => {
    setIsFlowActive(Boolean(isRideFlowActive));
  }, [isRideFlowActive]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleActive = () => setIsFlowActive(true);
    const handleInactive = () => setIsFlowActive(false);
    window.addEventListener('rider-flow-active', handleActive);
    window.addEventListener('rider-flow-inactive', handleInactive);
    window.addEventListener('exit-request-flow', handleInactive);
    return () => {
      window.removeEventListener('rider-flow-active', handleActive);
      window.removeEventListener('rider-flow-inactive', handleInactive);
      window.removeEventListener('exit-request-flow', handleInactive);
    };
  }, []);

  const openRideRequest = () => {
    window.location.hash = '#';
    window.dispatchEvent(new CustomEvent('rider-open-destination'));
  };

  return (
    <aside aria-label={tAuto('key_5cbbdfd5')} className={styles.root} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Brand Header with Distinct Teal 'بينكم' Coloring */}
      <div className={styles.header}>
        <Image
          src="/icons/logo-header.png"
          alt="بينكم"
          width={120}
          height={32}
          priority
          className={styles.brandLogo}
        />
        <h2 className={styles.brandTitle}>
          {isArabic ? (
            <>
              شبكة <span className="text-[#14F5D5] font-black drop-shadow-[0_0_8px_rgba(20,245,213,0.35)]">بينكم</span> للإعلان الرقمي
            </>
          ) : (
            <>
              <span className="text-[#14F5D5] font-black">Bynkcom</span> Ad Network
            </>
          )}
        </h2>
      </div>

      {/* User Profile Info */}
      <div className={styles.profile}>
        <Avatar className={styles.avatar}>
          <AvatarFallback className={styles.avatarFallback}>
            {initials(user.name || user.phone || 'م')}
          </AvatarFallback>
        </Avatar>
        <div className={cn(styles.identity, directionClass)}>
          <p className={cn(styles.name, directionClass)}>{user.name || text.fallbackName}</p>
          <p className={cn(styles.phone, directionClass)}>{user.phone || text.fallbackPhone}</p>
        </div>
        <Button
          aria-label={isArabic ? 'Switch to English' : tAuto('key_60799d01')}
          className={styles.language}
          onClick={toggleLanguage}
          size="sm"
          title={isArabic ? 'English' : tAuto('key_26b1b2b0')}
          type="button"
          variant="ghost"
        >
          <Languages className={styles.languageIcon} />
          <span>{isArabic ? 'EN' : tAuto('key_b4dfa835')}</span>
        </Button>
      </div>



      {/* Page 2: Captain Ads Sector Action Box */}
      {!isFlowActive && !isCritical && (
        <div className={styles.actionCard}>
          <div className={styles.actionBox}>
            <div className={styles.actionSectorTitle}>
              {text.captainSector}
            </div>
            <Button
              className={styles.request}
              onClick={openRideRequest}
              aria-label="ابحث واطلب"
            >
              <PlusCircle className={styles.actionIcon} />
              <span>{text.requestRide}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Navigation List matching Page 2 & 3 */}
      <nav className={styles.navigation}>
        {items.map((item) => {
          const active =
            hash === item.href ||
            (item.href === '#' && (hash === '' || hash === '#/'));

          return (
            <a
              className={cn(
                styles.navItem,
                active ? styles.navActive : styles.navIdle,
              )}
              href={item.href}
              key={item.href}
              onClick={item.onClick}
              aria-label={item.label}
            >
              <div className="flex items-center gap-2">
                <item.icon className={styles.navIcon} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white shadow-md animate-pulse">
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}

        {canShowInstallButton && (
          <Button
            className="h-11 w-full justify-between rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3.5 text-xs font-bold text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-all cursor-pointer mt-2"
            onClick={() => {
              if (canPromptNative) void triggerNativeInstall();
              else setIsInstallModalOpen(true);
            }}
            variant="ghost"
          >
            <span>{isArabic ? 'تثبيت التطبيق' : 'Install App'}</span>
            <Download className="h-4 w-4 text-[#14F5D5]" />
          </Button>
        )}
      </nav>

      {/* Footer / Logout */}
      <div className={styles.footer}>
        <Button className={styles.logout} onClick={() => void logout()}>
          <LogOut className={styles.actionIcon} />
          {text.logout}
        </Button>
      </div>

      <SovereignPwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isArabic={isArabic}
        role="rider"
      />
    </aside>
  );
}
