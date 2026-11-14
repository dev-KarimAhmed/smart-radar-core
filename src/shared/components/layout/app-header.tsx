'use client';

import Image from 'next/image';
import { useState, useEffect, type ReactNode } from 'react';
import { Bell, Languages } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { SovereignPwaInstallModal } from '@/components/sovereign-pwa-install-modal';
import { useNotifications } from '@/shared/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { getLandingPageUrl } from '@/lib/constants';
import { useTranslations } from "next-intl";
import { DriverCabin } from './header/driver-cabin';
import { headerStyles as styles } from './header/app-header-styles';

function initials(name = '') {
  const names = name.trim().split(/\s+/);
  if (names.length > 1) return `${names[0]?.[0] || ''}${names[1]?.[0] || ''}`;
  return name.substring(0, 2);
}

export function AppHeader({ sidebar }: { sidebar?: ReactNode }) {
  const tAuto = useTranslations('auto');
  const { user, isCaptain } = useAuth();
  const { isArabic, toggleLanguage } = useDashboardLanguage();
  const { hasUnread, adminUnreadCount, hasAdminUnread } = useNotifications();
  const { isStandalone } = usePwaInstall(isCaptain ? 'captain' : 'rider');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash || '#' : '#'));

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    const pending = localStorage.getItem('radar_pending_pwa_install_prompt');
    if (pending === 'true') {
      localStorage.removeItem('radar_pending_pwa_install_prompt');
      if (!isStandalone) {
        setIsInstallModalOpen(true);
      }
    }
  }, [isStandalone, user]);

  useEffect(() => {
    const handleHash = () => setCurrentHash(window.location.hash || '#');
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const isNotificationsActive = currentHash === '#notifications';

  const handleToggleNotifications = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#notifications') {
        window.location.hash = '#';
      } else {
        window.location.hash = '#notifications';
      }
    }
  };

  useEffect(() => {
    const handleOpen = () => { window.location.hash = '#notifications'; };
    window.addEventListener('open-app-notifications', handleOpen);
    return () => window.removeEventListener('open-app-notifications', handleOpen);
  }, []);

  return (
    <div className={styles.root}>
      <header className={cn(styles.primary, "relative")}>
        {user?.role === 'rider' ? (
          <button
            type="button"
            onClick={handleToggleNotifications}
            aria-label={isArabic ? 'رسائل وإشعارات المشرف' : 'Admin Notifications'}
            title={isArabic ? 'رسائل وإشعارات المشرف' : 'Admin Notifications'}
            className={cn(
              "relative inline-flex items-center justify-center rounded-xl border h-9 w-9 sm:h-10 sm:w-10 transition cursor-pointer shrink-0",
              isNotificationsActive
                ? "border-[#14B8A6]/50 bg-[#14B8A6]/20 text-[#14F5D5] shadow-[0_0_15px_rgba(20,245,213,0.25)]"
                : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
            )}
          >
            <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            {hasAdminUnread && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-lg animate-pulse">
                {adminUnreadCount > 99 ? '99+' : adminUnreadCount}
              </span>
            )}
          </button>
        ) : sidebar && user ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label={tAuto('key_4541dad4')}
                className={styles.menuButton}
                size="icon"
                variant="ghost"
              >
                <div className="relative flex items-center justify-center">
                  <Avatar className={styles.menuAvatar}>
                    <AvatarFallback className={styles.menuFallback}>{initials(user.name)}</AvatarFallback>
                  </Avatar>
                  {hasUnread && (
                    <span className="absolute -top-0.5 -end-0.5 flex h-3.5 w-3.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-rose-500 ring-2 ring-[#0A0F1D]" />
                    </span>
                  )}
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent className={styles.menuContent} side="right" hideClose>
              <SheetTitle className={styles.srOnly}>{tAuto('key_426510a4')}</SheetTitle>
              <SheetDescription className={styles.srOnly}>{tAuto('key_aa21658a')}</SheetDescription>
              {sidebar}
            </SheetContent>
          </Sheet>
        ) : <div className={styles.spacer} />}

        {user?.role === 'rider' ? (
          <div className={styles.requestRideWrapper}>
            <Button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  if (window.location.hash && window.location.hash !== '#') {
                    window.location.hash = '#';
                  }
                  window.dispatchEvent(new CustomEvent('rider-open-destination'));
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('rider-open-destination'));
                  }, 50);
                }
              }}
              className={styles.requestRideButton}
            >
              <span>{isArabic ? 'ابحث واطلب' : 'Search & Request'}</span>
            </Button>
          </div>
        ) : (
          <div className={styles.requestRideWrapper}>
            <a
              href={getLandingPageUrl()}
              className="inline-flex items-center cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Image
                src="/icons/logo-header.png"
                alt="Radar"
                width={585}
                height={152}
                priority
                className={styles.headerCenterLogo}
              />
            </a>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="h-8 gap-1.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 text-xs font-black text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-all cursor-pointer"
            title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Languages className="h-3.5 w-3.5" />
            <span>{isArabic ? 'EN' : 'عربي'}</span>
          </Button>
        </div>
      </header>
      {user && isCaptain ? <DriverCabin /> : null}

      <SovereignPwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isArabic={isArabic}
        role={isCaptain ? 'captain' : 'rider'}
      />
    </div>
  );
}
