'use client';

import { useState, useEffect, useCallback } from 'react';
import { Home, History, Wallet, User, Archive } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useRiderOperations } from '@/hooks/use-rider-operations';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import { useToast } from '@/hooks/use-toast';


export function BottomNav() {
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash || '#' : '#');
  const { user, isSovereign } = useAuth();
  const { toast } = useToast();

  // Safe context extraction within the tree bounds
  let riderOps: any = null;
  try {
    riderOps = useRiderOperations();
  } catch (err) {}

  let driverOps: any = null;
  try {
    driverOps = useDriverOperations();
  } catch (err) {}

  const isPassenger = user?.role === 'rider';
  const isCaptain = user?.role === 'driver';

  const tripStatus = isPassenger ? (riderOps?.tripStatus || 'idle') : 'idle';
  const driverStatus = isCaptain ? (driverOps?.driverStatus || 'idle') : 'idle';

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

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetHref: string) => {
    if (isRestricted && targetHref !== '#') {
      e.preventDefault();
      toast({
        variant: 'destructive',
        title: "🩸 جدار البث الشرياني نشط",
        description: "حظر مؤقت لتغيير اللوحة لمنع تمزق مسارات تتبع المركبة وفقدان الذاكرة المرحلية للرحلة السارية.",
      });
    }
  }, [isRestricted, toast]);
  
  if (!user || isSovereign) return null;

  const navItems = [
    { href: '#', icon: Home, label: 'الرئيسية' },
    { href: '#history', icon: History, label: 'السجل' },
    { href: '#vault', icon: Archive, label: 'الخزنة' },
    { href: '#wallet', icon: Wallet, label: 'المحفظة' },
    { href: '#profile', icon: User, label: 'حسابي' },
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
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all",
                isActive 
                  ? "text-emerald-400 bg-emerald-950/30" 
                  : "text-gray-500 hover:text-emerald-500/70"
              )}
            >
              <Icon className={cn("w-6 h-6 mb-1", isActive && "animate-pulse-slow")} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
