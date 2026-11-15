'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { styles, getInitials } from './desktop-sidebar-styles';

interface DesktopSidebarProfileProps {
  user: { name?: string; phone?: string };
  fallbackName: string;
  fallbackPhone: string;
  isArabic: boolean;
  toggleLanguage: () => void;
  directionClass: string;
}

export function DesktopSidebarProfile({
  user,
  fallbackName,
  fallbackPhone,
  isArabic,
  toggleLanguage,
  directionClass,
}: DesktopSidebarProfileProps) {
  const tAuto = useTranslations('auto');

  return (
    <div className={styles.profile}>
      <Avatar className={styles.avatar}>
        <AvatarFallback className={styles.avatarFallback}>
          {getInitials(user.name || user.phone || 'م')}
        </AvatarFallback>
      </Avatar>
      <div className={cn(styles.identity, directionClass)}>
        <p className={cn(styles.name, directionClass)}>{user.name || fallbackName}</p>
        <p className={cn(styles.phone, directionClass)}>{user.phone || fallbackPhone}</p>
      </div>
      <Button
        aria-label={isArabic ? 'Switch to English' : tAuto('key_60799d01')}
        className={styles.language}
        onClick={toggleLanguage}
        size="sm"
        title={isArabic ? 'English' : tAuto('key_26b1b2b0')}
        type="button"
        variant="ghost"
      >
        <Languages className={styles.languageIcon} />
        <span>{isArabic ? 'EN' : tAuto('key_b4dfa835')}</span>
      </Button>
    </div>
  );
}
