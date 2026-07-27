'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Archive, History, Home, User, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const styles = {
  root: 'fixed bottom-0 left-0 right-0 z-50',
  nav: 'flex items-center justify-around border-t border-white/[0.06] bg-[#0A0F1D]/80 px-2 pb-safe pt-2 shadow-[0_-4px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl',
  item: 'flex h-14 w-16 flex-col items-center justify-center rounded-xl transition-all',
  itemActive: 'bg-[#14B8A6]/10 text-[#14B8A6]',
  itemIdle: 'text-[#94A3B8] hover:text-[#14B8A6]/70',
  icon: 'mb-1 h-6 w-6',
  iconActive: 'animate-pulse-slow',
  label: 'text-[10px] font-bold',
} as const;

export function BottomNav() {
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash || '#' : '#');
  const { user, isSovereign } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('nav');
  const tErrors = useTranslations('errors');
  const isPassenger = user?.role === 'rider';
  const isCaptain = user?.role === 'driver';
  const [tripStatus, setTripStatus] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem('sovereign_trip_status') || 'idle' : 'idle',
  );
  const [driverStatus, setDriverStatus] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem('sovereign_driver_status') || 'idle' : 'idle',
  );

  useEffect(() => {
    const handleStatusChange = (event: Event) => {
      const detail = (event as CustomEvent<{ role?: string; status?: string }>).detail;
      if (detail?.role === 'rider') setTripStatus(detail.status || 'idle');
      if (detail?.role === 'driver') setDriverStatus(detail.status || 'idle');
    };
    window.addEventListener('sovereign-status-change', handleStatusChange);
    return () => window.removeEventListener('sovereign-status-change', handleStatusChange);
  }, []);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash || '#');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isRestricted =
    (isPassenger && ['searching', 'busy', 'rating', 'checkpoint_required'].includes(tripStatus)) ||
    (isCaptain && ['busy', 'rating'].includes(driverStatus));

  const handleNavClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, targetHref: string) => {
      if (!isRestricted || targetHref === '#') return;
      event.preventDefault();
      toast({
        variant: 'destructive',
        title: 'لا يمكن تغيير الصفحة الآن',
        description: tErrors('activeTripLocked'),
      });
    },
    [isRestricted, tErrors, toast],
  );

  if (!user || isSovereign) return null;

  const navItems = [
    { href: '#', icon: Home, label: t('home') },
    { href: '#history', icon: History, label: t('history') },
    { href: '#vault', icon: Archive, label: t('vault') },
    ...(!isPassenger ? [{ href: '#wallet', icon: Wallet, label: t('wallet') }] : []),
    { href: '#profile', icon: User, label: t('profile') },
  ];

  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = hash === item.href || (item.href === '#' && hash === '');
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => handleNavClick(event, item.href)}
              className={cn(styles.item, isActive ? styles.itemActive : styles.itemIdle)}
            >
              <Icon className={cn(styles.icon, isActive && styles.iconActive)} />
              <span className={styles.label}>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
