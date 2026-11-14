'use client';

import React from 'react';
import { Download, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { styles } from './desktop-sidebar-styles';

interface NavItemConfig {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string | null;
  onClick?: (e: React.MouseEvent) => void;
}

interface DesktopSidebarNavProps {
  items: NavItemConfig[];
  hash: string;
  canShowInstallButton: boolean;
  canPromptNative: boolean;
  triggerNativeInstall: () => void | Promise<void>;
  setIsInstallModalOpen: (open: boolean) => void;
  isArabic: boolean;
}

export function DesktopSidebarNav({
  items,
  hash,
  canShowInstallButton,
  canPromptNative,
  triggerNativeInstall,
  setIsInstallModalOpen,
  isArabic,
}: DesktopSidebarNavProps) {
  return (
    <nav className={styles.navigation}>
      {items.map((item) => {
        const active =
          hash === item.href ||
          (item.href === '#' && (hash === '' || hash === '#/'));

        return (
          <a
            className={cn(
              styles.navItem,
              active ? styles.navActive : styles.navIdle,
            )}
            href={item.href}
            key={item.href}
            onClick={item.onClick}
            aria-label={item.label}
          >
            <div className="flex items-center gap-2">
              <item.icon className={styles.navIcon} />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white shadow-md animate-pulse">
                {item.badge}
              </span>
            )}
          </a>
        );
      })}

      {canShowInstallButton && (
        <Button
          className="h-11 w-full justify-between rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3.5 text-xs font-bold text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-all cursor-pointer mt-2"
          onClick={() => {
            if (canPromptNative) void triggerNativeInstall();
            else setIsInstallModalOpen(true);
          }}
          variant="ghost"
        >
          <span>{isArabic ? 'تثبيت التطبيق' : 'Install App'}</span>
          <Download className="h-4 w-4 text-[#14F5D5]" />
        </Button>
      )}
    </nav>
  );
}
