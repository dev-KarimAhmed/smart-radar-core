'use client';

import { Archive, Bell, History, Home, Languages, LogOut, PlusCircle, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { cn } from '@/lib/utils';

const styles = {
  root: 'fixed inset-y-0 start-0 z-[140] hidden w-[288px] flex-col border-e border-white/[0.06] bg-[#0A0F1D]/95 shadow-[22px_0_70px_rgba(0,0,0,0.38)] backdrop-blur-xl lg:flex',
  profile: 'flex items-center gap-3 border-b border-white/10 p-5',
  avatar: 'h-12 w-12 border border-[#14B8A6]/35 bg-[#101827]',
  avatarFallback: 'bg-[#101827] text-sm font-black text-white',
  identity: 'min-w-0',
  identityRtl: 'text-right',
  identityLtr: 'text-left',
  name: 'truncate text-sm font-black text-white',
  phone: 'truncate text-xs font-bold text-[#14B8A6]',
  language: 'ms-auto h-8 shrink-0 gap-1 rounded-lg border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-2 text-[10px] font-black text-[#14F5D5] hover:bg-[#14B8A6]/20 hover:text-[#14F5D5]',
  languageIcon: 'h-3.5 w-3.5',
  actions: 'space-y-3 p-4',
  request: 'h-12 w-full justify-center gap-2 rounded-2xl bg-[#14B8A6] text-sm font-black text-[#031315] shadow-[0_16px_35px_rgba(20,184,166,0.18)] hover:bg-[#2DD4BF]',
  actionIcon: 'h-5 w-5',
  notifications: 'h-11 w-full justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-200 hover:bg-white/[0.07]',
  notificationIcon: 'h-4 w-4 text-[#14B8A6]',
  navigation: 'flex-1 space-y-2 px-4 pt-2',
  navItem: 'flex h-12 items-center justify-between rounded-2xl border px-4 text-sm font-black transition',
  navActive: 'border-[#14B8A6]/35 bg-[#14B8A6]/15 text-[#14F5D5]',
  navIdle: 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white',
  navIcon: 'h-5 w-5',
  footer: 'space-y-3 border-t border-white/10 p-4',
  account: 'rounded-2xl border border-[#14B8A6]/15 bg-[#14B8A6]/8 p-3',
  accountTitle: 'text-[11px] font-black text-[#14F5D5]',
  accountState: 'mt-1 text-xs font-bold text-slate-300',
  logout: 'h-12 w-full justify-center gap-2 rounded-2xl bg-red-600/90 text-sm font-black text-white hover:bg-red-500',
} as const;

const copy = {
  ar: {
    accountStatus: 'حالة الحساب',
    fallbackName: 'راكب',
    fallbackPhone: 'تطبيق الرحلات',
    logout: 'تسجيل الخروج',
    nav: { home: 'الرئيسية', history: 'رحلاتي', profile: 'حسابي', vault: 'الخزنة' },
    notifications: 'التنبيهات',
    ready: 'جاهز لطلب رحلة',
    requestRide: 'اطلب رحلة',
  },
  en: {
    accountStatus: 'Account status',
    fallbackName: 'Rider',
    fallbackPhone: 'Ride app',
    logout: 'Log out',
    nav: { home: 'Home', history: 'Trips', profile: 'Profile', vault: 'Vault' },
    notifications: 'Notifications',
    ready: 'Ready to request a ride',
    requestRide: 'Request ride',
  },
} satisfies Record<AppLanguage, {
  accountStatus: string;
  fallbackName: string;
  fallbackPhone: string;
  logout: string;
  nav: Record<'home' | 'history' | 'profile' | 'vault', string>;
  notifications: string;
  ready: string;
  requestRide: string;
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
}: {
  hash: string;
  language: AppLanguage;
  logout: () => void | Promise<void>;
  onNotify: () => void;
  user: { name?: string; phone?: string };
}) {
  const { isArabic, toggleLanguage } = useDashboardLanguage();
  const text = copy[language];
  const directionClass = language === 'ar' ? styles.identityRtl : styles.identityLtr;
  const items = [
    { href: '#', icon: Home, label: text.nav.home },
    { href: '#history', icon: History, label: text.nav.history },
    { href: '#vault', icon: Archive, label: text.nav.vault },
    { href: '#profile', icon: User, label: text.nav.profile },
  ];

  const openRideRequest = () => {
    window.location.hash = '#';
    window.dispatchEvent(new CustomEvent('rider-open-destination'));
  };

  return (
    <aside aria-label="قائمة الراكب الرئيسية" className={styles.root} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className={styles.profile}>
        <Avatar className={styles.avatar}>
          <AvatarFallback className={styles.avatarFallback}>
            {initials(user.name || user.phone || 'R')}
          </AvatarFallback>
        </Avatar>
        <div className={cn(styles.identity, directionClass)}>
          <p className={cn(styles.name, directionClass)}>{user.name || text.fallbackName}</p>
          <p className={cn(styles.phone, directionClass)}>{user.phone || text.fallbackPhone}</p>
        </div>
        <Button
          aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
          className={styles.language}
          onClick={toggleLanguage}
          size="sm"
          title={isArabic ? 'English' : 'العربية'}
          type="button"
          variant="ghost"
        >
          <Languages className={styles.languageIcon} />
          <span>{isArabic ? 'EN' : 'ع'}</span>
        </Button>
      </div>

      <div className={styles.actions}>
        <Button className={styles.request} onClick={openRideRequest}>
          <PlusCircle className={styles.actionIcon} />
          {text.requestRide}
        </Button>
        <Button className={styles.notifications} onClick={onNotify} variant="ghost">
          <Bell className={styles.notificationIcon} />
          {text.notifications}
        </Button>
      </div>

      <nav className={styles.navigation}>
        {items.map(({ href, icon: Icon, label }) => {
          const active = hash === href || (href === '#' && (hash === '' || hash === '#/'));
          return (
            <a className={cn(styles.navItem, active ? styles.navActive : styles.navIdle)} href={href} key={href}>
              <span>{label}</span>
              <Icon className={styles.navIcon} />
            </a>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={cn(styles.account, directionClass)}>
          <p className={styles.accountTitle}>{text.accountStatus}</p>
          <p className={styles.accountState}>{text.ready}</p>
        </div>
        <Button className={styles.logout} onClick={() => void logout()}>
          <LogOut className={styles.actionIcon} />
          {text.logout}
        </Button>
      </div>
    </aside>
  );
}
