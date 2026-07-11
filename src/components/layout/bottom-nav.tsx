'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Archive, History, Home, User, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function BottomNav() {
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash || '#' : '#');
  const { user, isSovereign } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('nav');
  const tErrors = useTranslations('errors');

  const isPassenger = user?.role === 'rider';
  const isCaptain = user?.role === 'driver';

  const [tripStatus, setTripStatus] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sovereign_trip_status') || 'idle';
    }
    return 'idle';
  });

  const [driverStatus, setDriverStatus] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sovereign_driver_status') || 'idle';
    }
    return 'idle';
  });

  useEffect(() => {
    const handleStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (!customEvent.detail) return;

      const { role, status } = customEvent.detail;
      if (role === 'rider') {
        setTripStatus(status || 'idle');
      } else if (role === 'driver') {
        setDriverStatus(status || 'idle');
      }
    };

    window.addEventListener('sovereign-status-change', handleStatusChange);
    return () => window.removeEventListener('sovereign-status-change', handleStatusChange);
  }, []);

  const isRiderRestricted = isPassenger && ['searching', 'busy', 'rating', 'checkpoint_required'].includes(tripStatus);
  const isDriverRestricted = isCaptain && ['busy', 'rating'].includes(driverStatus);
  const isRestricted = isRiderRestricted || isDriverRestricted;

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || '#');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, targetHref: string) => {
      if (isRestricted && targetHref !== '#') {
        event.preventDefault();
        toast({
          variant: 'destructive',
          title: 'لا يمكن تغيير الصفحة الآن',
          description: tErrors('activeTripLocked'),
        });
      }
    },
    [isRestricted, toast]
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
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <nav className="flex items-center justify-around bg-[#0A0F1D]/80 backdrop-blur-xl border-t border-white/[0.06] shadow-[0_-4px_30px_rgba(0,0,0,0.3)] pb-safe pt-2 px-2">
        {navItems.map((item) => {
          const isActive = hash === item.href || (item.href === '#' && hash === '');
          const Icon = item.icon;

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => handleNavClick(event, item.href)}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all',
                isActive ? 'text-[#14B8A6] bg-[#14B8A6]/10' : 'text-[#94A3B8] hover:text-[#14B8A6]/70'
              )}
            >
              <Icon className={cn('w-6 h-6 mb-1', isActive && 'animate-pulse-slow')} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}

