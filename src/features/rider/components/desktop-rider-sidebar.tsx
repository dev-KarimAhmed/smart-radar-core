'use client';

import React from 'react';
import Image from 'next/image';
import { Archive, Bell, History, Home, LogOut, PlusCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { getLandingPageUrl } from '@/lib/constants';
import { useTranslations } from "next-intl";
import { useNotifications } from '@/shared/hooks/use-notifications';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { SovereignPwaInstallModal } from '@/components/sovereign-pwa-install-modal';
import { styles, desktopSidebarCopy } from './desktop-sidebar/desktop-sidebar-styles';
import { DesktopSidebarProfile } from './desktop-sidebar/desktop-sidebar-profile';
import { DesktopSidebarNav } from './desktop-sidebar/desktop-sidebar-nav';

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
  const { adminUnreadCount, hasAdminUnread, tripUnreadCount, hasTripUnread } = useNotifications();
  const { canShowInstallButton, canPromptNative, triggerNativeInstall } = usePwaInstall('rider');
  const [isInstallModalOpen, setIsInstallModalOpen] = React.useState(false);
  const text = desktopSidebarCopy[language];
  const directionClass = language === 'ar' ? styles.identityRtl : styles.identityLtr;

  const items = [
    {
      href: '#notifications',
      icon: Bell,
      label: text.nav.notifications,
      badge: hasAdminUnread ? (adminUnreadCount > 99 ? '99+' : String(adminUnreadCount)) : null,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.hash = '#notifications';
        onNotify();
      },
    },
    { href: '#', icon: Home, label: text.nav.home },
    {
      href: '#history',
      icon: History,
      label: text.nav.history,
      badge: hasTripUnread ? (tripUnreadCount > 99 ? '99+' : String(tripUnreadCount)) : null,
    },
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
        <a
          href={getLandingPageUrl()}
          className="inline-flex items-center cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Image
            src="/icons/logo-header.png"
            alt="بينكم"
            width={120}
            height={32}
            priority
            className={styles.brandLogo}
          />
        </a>
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

      <DesktopSidebarProfile
        user={user}
        fallbackName={text.fallbackName}
        fallbackPhone={text.fallbackPhone}
        isArabic={isArabic}
        toggleLanguage={toggleLanguage}
        directionClass={directionClass}
      />

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

      <DesktopSidebarNav
        items={items}
        hash={hash}
        canShowInstallButton={canShowInstallButton}
        canPromptNative={canPromptNative}
        triggerNativeInstall={() => { void triggerNativeInstall(); }}
        setIsInstallModalOpen={setIsInstallModalOpen}
        isArabic={isArabic}
      />

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
