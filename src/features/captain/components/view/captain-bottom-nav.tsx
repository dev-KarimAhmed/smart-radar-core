'use client';

import React from 'react';
import { History, User, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { CaptainScreen } from '../../state/captain-state-machine';

const styles = {
  mobileBottomNavRoot: 'fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#0A0F1D]/90 px-3 pb-safe pt-1.5 shadow-[0_-4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:hidden',
  mobileBottomNavInner: 'mx-auto flex max-w-md items-center justify-around',
  mobileBottomNavItem: 'flex h-14 w-20 flex-col items-center justify-center rounded-xl transition-all cursor-pointer',
  mobileBottomNavItemActive: 'bg-[#14B8A6]/15 text-[#14F5D5]',
  mobileBottomNavItemIdle: 'text-slate-400 hover:text-slate-200',
  mobileBottomNavIcon: 'mb-1 h-5 w-5 transition-transform shrink-0',
  mobileBottomNavIconActive: 'scale-110',
  mobileBottomNavLabel: 'text-[10px] font-bold tracking-tight text-center leading-tight w-full block',
} as const;

export interface CaptainBottomNavProps {
  screen: CaptainScreen;
  historyUnreadCount?: number;
  hasHistoryUnread?: boolean;
  onSelectTab: (screen: 'WALLET' | 'HISTORY' | 'PROFILE') => void;
}

export function CaptainBottomNav({
  screen,
  historyUnreadCount,
  hasHistoryUnread,
  onSelectTab,
}: CaptainBottomNavProps) {
  const t = useTranslations('captainDashboard');

  if (screen === 'ACTIVE_TRIP') {
    return null;
  }

  return (
    <div className={styles.mobileBottomNavRoot}>
      <nav className={styles.mobileBottomNavInner}>
        <BottomNavItem
          active={screen === 'WALLET'}
          onClick={() => onSelectTab('WALLET')}
          icon={<Wallet className={cn(styles.mobileBottomNavIcon, screen === 'WALLET' && styles.mobileBottomNavIconActive)} />}
          label={t('wallet')}
        />
        <BottomNavItem
          active={screen === 'HISTORY'}
          onClick={() => onSelectTab('HISTORY')}
          icon={<History className={cn(styles.mobileBottomNavIcon, screen === 'HISTORY' && styles.mobileBottomNavIconActive)} />}
          label={t('history')}
          badgeCount={hasHistoryUnread ? historyUnreadCount : undefined}
        />
        <BottomNavItem
          active={screen === 'PROFILE'}
          onClick={() => onSelectTab('PROFILE')}
          icon={<User className={cn(styles.mobileBottomNavIcon, screen === 'PROFILE' && styles.mobileBottomNavIconActive)} />}
          label={t('profile')}
        />
      </nav>
    </div>
  );
}

function BottomNavItem({
  active,
  icon,
  label,
  onClick,
  badgeCount,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badgeCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(styles.mobileBottomNavItem, active ? styles.mobileBottomNavItemActive : styles.mobileBottomNavItemIdle, 'relative')}
    >
      <div className="relative inline-flex items-center justify-center">
        {icon}
        {Boolean(badgeCount && badgeCount > 0) && (
          <span className="absolute -top-1 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse ring-1 ring-[#0A0F1D]">
            {badgeCount! > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      <span className={styles.mobileBottomNavLabel}>{label}</span>
    </button>
  );
}
