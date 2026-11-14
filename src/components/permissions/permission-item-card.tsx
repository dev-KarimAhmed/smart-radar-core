'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { styles, type PermissionCheckStatus } from './permissions-types';

export interface PermissionItemCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: PermissionCheckStatus;
  isRequesting: boolean;
  onRequest: () => void;
  isArabic: boolean;
}

export function PermissionItemCard({
  icon,
  title,
  description,
  status,
  isRequesting,
  onRequest,
  isArabic,
}: PermissionItemCardProps) {
  return (
    <div className={styles.permissionCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleWrap}>
          <div className={styles.cardIconWrap}>
            {icon}
          </div>
          <div className="min-w-0">
            <h4 className={styles.cardTitle}>{title}</h4>
            <p className={styles.cardDesc}>{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {status === 'granted' && (
            <span className={styles.statusBadgeGranted}>
              <CheckCircle2 className="h-2.5 w-2.5" />
              {isArabic ? 'مُفعّل' : 'Granted'}
            </span>
          )}

          {status === 'denied' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={styles.statusBadgeDenied}>
                <XCircle className="h-2.5 w-2.5" />
                {isArabic ? 'محظور' : 'Denied'}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={onRequest}
                disabled={isRequesting}
                className={styles.inlineActionButton}
              >
                {isRequesting
                  ? (isArabic ? 'جاري الفحص...' : '...')
                  : (isArabic ? 'إعادة المحاولة' : 'Retry')}
              </Button>
            </div>
          )}

          {(status === 'prompt' || status === 'checking') && (
            <Button
              type="button"
              size="sm"
              onClick={onRequest}
              disabled={isRequesting}
              className={styles.inlineActionButton}
            >
              {isRequesting
                ? (isArabic ? 'جاري الفحص...' : '...')
                : (isArabic ? 'تفعيل الآن' : 'Enable')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
