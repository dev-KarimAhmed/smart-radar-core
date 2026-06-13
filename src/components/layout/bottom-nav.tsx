'use client';

import { useState, useEffect } from 'react';
import { Home, History, Wallet, User, Archive } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';


export function BottomNav() {
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash || '#' : '#');
  const { user, isSovereign } = useAuth();
  
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || '#');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
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
