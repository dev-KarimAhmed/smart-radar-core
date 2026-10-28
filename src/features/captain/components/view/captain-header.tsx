'use client';

import React from 'react';
import Image from 'next/image';
import { Bell, History, Languages, Loader2, LogOut, User, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { CaptainScreen } from '../../state/captain-state-machine';
import { MarketStatusIndicator } from '../market-status-indicator';

const styles = {
  headerCard: 'flex flex-col gap-3 rounded-3xl border border-emerald-500/20 bg-[#05080f] p-3 sm:p-4',
  topRow: 'flex flex-col gap-2.5 sm:grid sm:grid-cols-3 sm:items-center sm:gap-3',
  brandRow: 'relative flex items-center justify-center w-full min-h-[34px] sm:w-auto sm:justify-start',
  logoWrap: 'absolute start-0 flex items-center shrink-0 z-10',
  logoImage: 'h-6 sm:h-8 w-auto object-contain',
  marketWrapMobile: 'flex items-center justify-center sm:hidden',
  marketWrapDesktop: 'hidden sm:flex sm:justify-center sm:items-center',
  actionsWrap: 'grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:justify-end',
  actionIcon: 'h-4 w-4 shrink-0',
  logoutIcon: 'h-4 w-4 shrink-0 rotate-180',
  actionLabel: 'text-xs font-black sm:text-sm',
  notificationsBtn: 'relative sm:order-3 inline-flex items-center justify-center rounded-xl border px-3 py-2.5 transition sm:rounded-2xl sm:px-3.5 sm:py-3 w-full sm:w-auto',
  notificationsBtnActive: 'border-[#14B8A6]/50 bg-[#14B8A6]/20 text-[#14F5D5]',
  notificationsBtnIdle: 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white',
  unreadBadge: 'absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-lg animate-pulse',
  languageBtn: 'sm:order-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-2.5 text-[#14F5D5] transition hover:bg-[#14B8A6]/20 sm:rounded-2xl sm:px-4 sm:py-3 w-full sm:w-auto',
  logoutBtn: 'sm:order-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-600/15 px-2.5 py-2.5 text-red-100 transition hover:bg-red-600/25 sm:rounded-2xl sm:px-4 sm:py-3 w-full sm:w-auto',
  statusRow: 'flex items-center gap-2 sm:gap-3 w-full',
  statusBtnBase: 'relative inline-flex w-full sm:w-auto sm:flex-[1.8] sm:grow-[2] items-center justify-center gap-2.5 rounded-2xl px-4 py-3 sm:px-6 sm:py-3.5 text-sm sm:text-base font-black transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 select-none',
  statusBtnActive: 'border-2 border-emerald-400 bg-gradient-to-r from-emerald-500/25 via-emerald-500/35 to-teal-500/25 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:bg-emerald-500/40 ring-1 ring-emerald-400/50',
  statusBtnIdle: 'border-2 border-slate-600/80 bg-slate-800/90 text-slate-200 hover:bg-slate-700/90 hover:border-slate-500 shadow-md',
  statusActiveDotContainer: 'relative flex h-3 w-3 shrink-0',
  statusActiveDotPing: 'absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75',
  statusActiveDotCore: 'relative inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]',
  statusIdleDot: 'h-3 w-3 shrink-0 rounded-full bg-rose-500 ring-2 ring-rose-500/30',
  statusUpdatingSpinner: 'h-4 w-4 animate-spin text-emerald-400',
  navBtn: 'relative hidden sm:inline-flex items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-black transition sm:gap-2 sm:px-3 sm:py-3.5 sm:text-sm sm:flex-1 sm:basis-0',
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
  marketIndicator: any;
  onToggleStatus: () => void;
  onOpenNotifications: () => void;
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
  marketIndicator,
  onToggleStatus,
  onOpenNotifications,
  onToggleLanguage,
  onLogout,
  onOpenWallet,
  onOpenHistory,
  onOpenProfile,
}: CaptainHeaderProps) {
  const t = useTranslations('captainDashboard');

  const isRtl = direction === 'rtl';
  return (
    <header className={styles.headerCard}>
      {/* 1. الصف الأول: اللوجو يميناً، قوة السوق في المنتصف للموبايل والويب، وصف الإجراءات يساراً */}
      <div className={styles.topRow}>
        <div className={styles.brandRow}>
          <div className={styles.logoWrap}>
            <Image
              src="/icons/logo-header.png"
              alt="Radar"
              width={110}
              height={28}
              priority
              className={styles.logoImage}
            />
          </div>
          <div className={styles.marketWrapMobile}>
            <MarketStatusIndicator indicator={marketIndicator} size="compact" />
          </div>
        </div>

        <div className={styles.marketWrapDesktop}>
          <MarketStatusIndicator indicator={marketIndicator} size="compact" />
        </div>

        <div className={styles.actionsWrap}>
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
            onClick={onOpenNotifications}
            aria-label={t('notifications')}
            title={t('notifications')}
            className={cn(
              styles.notificationsBtn,
              screen === 'NOTIFICATIONS' ? styles.notificationsBtnActive : styles.notificationsBtnIdle,
            )}
          >
            <Bell className={styles.actionIcon} />
            {hasUnread && (
              <span className={styles.unreadBadge}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label={t('logout')}
            title={t('logout')}
            className={styles.logoutBtn}
          >
            <LogOut className={styles.logoutIcon} />
            <span className={styles.actionLabel}>{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* 2. الصف الثاني: الرصيد أولاً، ثم زر متاح وغير متاح بحجم أكبر، ثم السجل وحسابي */}
      <div className={styles.statusRow}>
        <NavButton
          active={screen === 'WALLET'}
          onClick={onOpenWallet}
          label={t('wallet')}
          icon={<Wallet className={styles.navBtnIcon} />}
        />

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

        <NavButton
          active={screen === 'HISTORY'}
          onClick={onOpenHistory}
          label={t('history')}
          icon={<History className={styles.navBtnIcon} />}
        />
        <NavButton
          active={screen === 'PROFILE'}
          onClick={onOpenProfile}
          label={t('profile')}
          icon={<User className={styles.navBtnIcon} />}
        />
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
