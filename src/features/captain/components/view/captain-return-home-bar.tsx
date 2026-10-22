'use client';

import React from 'react';
import { Bell, History, Home, User, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';

const styles = {
  returnHomeBar: 'flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#070e1c]/90 p-3 sm:p-4 backdrop-blur-xl shadow-lg',
  returnHomeButton: 'inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-4 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-black text-emerald-300 transition-all shadow-md active:scale-95 cursor-pointer',
  returnHomeIcon: 'h-4 w-4 text-emerald-400',
  returnHomeCurrentTab: 'flex items-center gap-2 text-xs font-bold text-slate-300',
  returnHomeTabLabel: 'flex items-center gap-1.5 text-slate-200',
  returnHomeTabIcon: 'h-4 w-4 text-[#14F5D5]',
} as const;

export interface CaptainReturnHomeBarProps {
  screen: string;
  onReturnHome: () => void;
}

export function CaptainReturnHomeBar({
  screen,
  onReturnHome,
}: CaptainReturnHomeBarProps) {
  const t = useTranslations('captainDashboard');

  if (!['WALLET', 'HISTORY', 'PROFILE', 'NOTIFICATIONS'].includes(screen)) {
    return null;
  }

  return (
    <div className={styles.returnHomeBar}>
      <button
        type="button"
        onClick={onReturnHome}
        className={styles.returnHomeButton}
      >
        <Home className={styles.returnHomeIcon} />
        <span>{t('backToHome')}</span>
      </button>
      <div className={styles.returnHomeCurrentTab}>
        {screen === 'WALLET' && (
          <span className={styles.returnHomeTabLabel}>
            <Wallet className={styles.returnHomeTabIcon} />
            <span>{t('wallet')}</span>
          </span>
        )}
        {screen === 'HISTORY' && (
          <span className={styles.returnHomeTabLabel}>
            <History className={styles.returnHomeTabIcon} />
            <span>{t('history')}</span>
          </span>
        )}
        {screen === 'PROFILE' && (
          <span className={styles.returnHomeTabLabel}>
            <User className={styles.returnHomeTabIcon} />
            <span>{t('profile')}</span>
          </span>
        )}
        {screen === 'NOTIFICATIONS' && (
          <span className={styles.returnHomeTabLabel}>
            <Bell className={styles.returnHomeTabIcon} />
            <span>{t('notifications')}</span>
          </span>
        )}
      </div>
    </div>
  );
}
