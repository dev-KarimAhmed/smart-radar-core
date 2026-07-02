'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, History, Home, User, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { simpleCopy } from '@/lib/i18n/simple-copy';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function BottomNav() {
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash || '#' : '#');
  const { user, isSovereign } = useAuth();
  const { toast } = useToast();

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
          description: simpleCopy.errors.activeTripLocked.ar,
        });
      }
    },
    [isRestricted, toast]
  );

  if (!user || isSovereign) return null;

  const navItems = [
    { href: '#', icon: Home, label: simpleCopy.nav.home.ar },
    { href: '#history', icon: History, label: simpleCopy.nav.history.ar },
    { href: '#vault', icon: Archive, label: simpleCopy.nav.vault.ar },
    { href: '#wallet', icon: Wallet, label: simpleCopy.nav.wallet.ar },
    { href: '#profile', icon: User, label: simpleCopy.nav.profile.ar },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <nav className="flex items-center justify-around bg-[#050D05] border-t border-emerald-900/40 pb-safe pt-2 px-2">
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
                isActive ? 'text-emerald-400 bg-emerald-950/30' : 'text-gray-500 hover:text-emerald-500/70'
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

