'use client';

import React from 'react';
import { Archive, Bell, History, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetClose } from '@/components/ui/sheet';
import { useTranslations } from 'next-intl';
import { styles } from './app-sidebar-styles';

interface RiderSidebarOperationsProps {
  isArabic: boolean;
  hasUnread: boolean;
}

export function RiderSidebarOperations({ isArabic, hasUnread }: RiderSidebarOperationsProps) {
  const tAuto = useTranslations('auto');

  return (
    <div className={styles.operations}>
      <div className={styles.sectionTitle}>
        <span className={styles.sectionText}>{tAuto('key_2133ac1c')}</span>
      </div>

      {/* Notification Trigger with Pulsing Badge */}
      <Button
        className={styles.operationButton}
        variant="ghost"
        onClick={() => {
          window.location.hash = '#notifications';
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }}
      >
        <span className={styles.operationText}>{isArabic ? 'التنبيهات' : 'Notifications'}</span>
        <div className="relative flex items-center gap-2">
          <Bell className={styles.operationIcon} />
          {hasUnread && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
          )}
        </div>
      </Button>

      <SheetClose asChild>
        <a className={styles.operationLink} href="#history">
          <Button className={styles.operationButton} variant="ghost">
            <span className={styles.operationText}>{isArabic ? 'سجلي مع معلن' : 'My Log with Advertiser'}</span>
            <History className={styles.operationIcon} />
          </Button>
        </a>
      </SheetClose>

      <SheetClose asChild>
        <a className={styles.operationLink} href="#vault">
          <Button className={styles.operationButton} variant="ghost">
            <span className={styles.operationText}>{isArabic ? 'الخزنة' : 'Vault'}</span>
            <Archive className={styles.operationIcon} />
          </Button>
        </a>
      </SheetClose>

      <SheetClose asChild>
        <a className={styles.operationLink} href="#profile">
          <Button className={styles.operationButton} variant="ghost">
            <span className={styles.operationText}>{tAuto('key_f38edfd8')}</span>
            <User className={styles.operationIcon} />
          </Button>
        </a>
      </SheetClose>
    </div>
  );
}
