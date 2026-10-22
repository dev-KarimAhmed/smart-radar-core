'use client';

import React from 'react';
import Image from 'next/image';
import { Bell, Download, History, Languages, Loader2, LogOut, User, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { CaptainScreen } from '../../state/captain-state-machine';
import { MarketStatusIndicator } from '../market-status-indicator';

const styles = {
  headerCard: 'flex flex-col gap-3 rounded-3xl border border-emerald-500/20 bg-[#05080f] p-3 sm:p-4',
  headerTopRow: 'flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3',
  headerTitleWrap: 'w-full sm:w-auto flex items-center justify-between',
  logoGroup: 'flex items-center gap-2.5',
  headerLogo: 'h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(20,184,166,0.35)]',
  titleText: 'text-lg font-black whitespace-nowrap sm:text-2xl',
  actionsWrap: 'flex w-full sm:w-auto flex-wrap items-center justify-start sm:justify-end gap-1.5 sm:gap-2',
  installBtn: 'inline-flex items-center gap-1.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-2 text-[#14F5D5] transition hover:bg-[#14B8A6]/20 sm:rounded-2xl sm:px-4 sm:py-3',
  actionIcon: 'h-4 w-4',
  actionLabel: 'text-xs font-black sm:text-sm',
  notificationsBtn: 'relative inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 transition sm:rounded-2xl sm:px-4 sm:py-3',
  notificationsBtnActive: 'border-[#14B8A6]/50 bg-[#14B8A6]/20 text-[#14F5D5]',
  notificationsBtnIdle: 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white',
  unreadBadge: 'absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-lg animate-pulse',
  languageBtn: 'inline-flex items-center gap-1.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-2 text-[#14F5D5] transition hover:bg-[#14B8A6]/20 sm:rounded-2xl sm:px-4 sm:py-3',
  logoutBtn: 'inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-600/15 px-2.5 py-2 text-red-100 transition hover:bg-red-600/25 sm:rounded-2xl sm:px-4 sm:py-3',
  statusRow: 'flex flex-wrap items-center gap-1.5 sm:gap-2',
  statusBtnBase: 'relative inline-flex items-center justify-center gap-2.5 rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 select-none',
  statusBtnActive: 'border-2 border-emerald-400 bg-gradient-to-r from-emerald-500/25 via-emerald-500/35 to-teal-500/25 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:bg-emerald-500/40 ring-1 ring-emerald-400/50',
  statusBtnIdle: 'border-2 border-slate-600/80 bg-slate-800/90 text-slate-200 hover:bg-slate-700/90 hover:border-slate-500 shadow-md',
  statusActiveDotContainer: 'relative flex h-3 w-3 shrink-0',
  statusActiveDotPing: 'absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75',
  statusActiveDotCore: 'relative inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]',
  statusIdleDot: 'h-3 w-3 shrink-0 rounded-full bg-rose-500 ring-2 ring-rose-500/30',
  statusUpdatingSpinner: 'h-4 w-4 animate-spin text-emerald-400',
  desktopNavGrid: 'hidden sm:grid sm:grid-cols-3 sm:basis-0 sm:grow gap-1.5 sm:gap-2',
  navBtn: 'relative inline-flex items-center justify-center gap-1.5 rounded-2xl px-1.5 py-2.5 text-[11px] font-black transition sm:gap-2 sm:px-4 sm:py-3 sm:text-sm',
  navBtnActive: 'bg-[#14B8A6] text-[#06111f]',
  navBtnIdle: 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10',
  navBtnText: 'truncate',
  navBtnIcon: 'h-4 w-4',
} as const;

export interface CaptainHeaderProps {
  screen: CaptainScreen;
  direction: string;
  isActive: boolean;
  isOffline: boolean;
  isReconnecting: boolean;
  isUpdatingStatus: boolean;
  unreadCount: number;
  hasUnread: boolean;
  canShowInstallButton: boolean;
  canPromptNative: boolean;
  marketIndicator: any;
  onToggleStatus: () => void;
  onOpenNotifications: () => void;
  onOpenInstall: () => void;
  onTriggerNativeInstall: () => void;
  onToggleLanguage: () => void;
  onLogout: () => void;
  onOpenWallet: () => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
}

export function CaptainHeader({
  screen,
  direction,
  isActive,
  isOffline,
  isReconnecting,
  isUpdatingStatus,
  unreadCount,
  hasUnread,
  canShowInstallButton,
  canPromptNative,
  marketIndicator,
  onToggleStatus,
  onOpenNotifications,
  onOpenInstall,
  onTriggerNativeInstall,
  onToggleLanguage,
  onLogout,
  onOpenWallet,
  onOpenHistory,
  onOpenProfile,
}: CaptainHeaderProps) {
  const t = useTranslations('captainDashboard');

  return (
    <header className={styles.headerCard}>
      <div className={styles.headerTopRow}>
        <div className={styles.headerTitleWrap}>
          <div className={styles.logoGroup}>
            <Image
              src="/icons/logo-header.png"
              alt="Radar"
              width={585}
              height={152}
              priority
              className={styles.headerLogo}
            />
            <h1 className={styles.titleText}>{t('title')}</h1>
          </div>
        </div>
        <div className={styles.actionsWrap}>
          {canShowInstallButton && (
            <button
              type="button"
              onClick={() => {
                if (canPromptNative) onTriggerNativeInstall();
                else onOpenInstall();
              }}
              title={direction === 'rtl' ? 'تثبيت التطبيق' : 'Install App'}
              className={styles.installBtn}
            >
              <Download className={styles.actionIcon} />
              <span className={styles.actionLabel}>{direction === 'rtl' ? 'تثبيت' : 'Install'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={t('notifications')}
            title={t('notifications')}
            className={cn(
              styles.notificationsBtn,
              screen === 'NOTIFICATIONS' ? styles.notificationsBtnActive : styles.notificationsBtnIdle,
            )}
          >
            <Bell className={styles.actionIcon} />
            <span className={styles.actionLabel}>{t('notifications')}</span>
            {hasUnread && (
              <span className={styles.unreadBadge}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onToggleLanguage}
            aria-label={t('switchLanguageAria')}
            title={t('switchLanguageLabel')}
            className={styles.languageBtn}
          >
            <Languages className={styles.actionIcon} />
            <span className={styles.actionLabel}>{t('switchLanguageLabel')}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label={t('logout')}
            title={t('logout')}
            className={styles.logoutBtn}
          >
            <LogOut className={styles.actionIcon} />
            <span className={styles.actionLabel}>{t('logout')}</span>
          </button>
        </div>
      </div>

      <div className={styles.statusRow}>
        <button
          type="button"
          onClick={onToggleStatus}
          disabled={isOffline || isReconnecting || isUpdatingStatus}
          className={cn(styles.statusBtnBase, isActive ? styles.statusBtnActive : styles.statusBtnIdle)}
        >
          {isUpdatingStatus ? (
            <>
              <Loader2 className={styles.statusUpdatingSpinner} />
              <span>{t('statusUpdating')}</span>
            </>
          ) : isActive ? (
            <>
              <span className={styles.statusActiveDotContainer}>
                <span className={styles.statusActiveDotPing} />
                <span className={styles.statusActiveDotCore} />
              </span>
              <span>{t('online')}</span>
            </>
          ) : (
            <>
              <span className={styles.statusIdleDot} />
              <span>{t('offline')}</span>
            </>
          )}
        </button>
        <MarketStatusIndicator indicator={marketIndicator} size="compact" />
        <div className={styles.desktopNavGrid}>
          <NavButton active={screen === 'WALLET'} onClick={onOpenWallet} label={t('wallet')} icon={<Wallet className={styles.navBtnIcon} />} />
          <NavButton active={screen === 'HISTORY'} onClick={onOpenHistory} label={t('history')} icon={<History className={styles.navBtnIcon} />} />
          <NavButton active={screen === 'PROFILE'} onClick={onOpenProfile} label={t('profile')} icon={<User className={styles.navBtnIcon} />} />
        </div>
      </div>
    </header>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(styles.navBtn, active ? styles.navBtnActive : styles.navBtnIdle)}
    >
      {icon}
      <span className={styles.navBtnText}>{label}</span>
    </button>
  );
}
