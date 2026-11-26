'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChevronDown, FileCheck2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  getStoredLegalDeclarations,
  type LegalDeclarationRecord,
  LEGAL_DECLARATION_TEXT,
} from '../../services/legal-log-service';
import {
  legalDeclarationsStyles as styles,
  type HistoryLegalDeclarationsProps,
} from './legal/legal-declarations-styles';
import { LegalDeclarationCard } from './legal/legal-declaration-card';

export * from './legal/legal-declarations-styles';
export * from './legal/legal-declarations-helpers';
export * from './legal/legal-declaration-card';

export function HistoryLegalDeclarations({ isArabic = true }: HistoryLegalDeclarationsProps) {
  const { user } = useAuth();
  const [declarations, setDeclarations] = useState<LegalDeclarationRecord[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const loadRecords = () => {
      let items = getStoredLegalDeclarations(user.uid);
      // If user has no local declaration yet, synthesize initial registration declaration
      if (items.length === 0) {
        const userCreatedAt = (user as any)?.created_at;
        const initialDate = userCreatedAt ? new Date(userCreatedAt) : new Date();
        const fallbackSerial = user.serial_id || `U-${user.uid.slice(0, 6).toUpperCase()}`;
        const defaultItem: LegalDeclarationRecord = {
          id: `DEC-${initialDate.getFullYear()}${String(initialDate.getMonth() + 1).padStart(2, '0')}-1001`,
          userId: user.uid,
          userSerialId: fallbackSerial,
          actionType: 'NEW_ACCOUNT',
          actionLabel: isArabic ? 'تسجيل حساب جديد' : 'New Account Registration',
          declarationText: LEGAL_DECLARATION_TEXT,
          timestamp: initialDate.getTime(),
          preciseTime: `${String(initialDate.getHours()).padStart(2, '0')}:${String(initialDate.getMinutes()).padStart(2, '0')}:${String(initialDate.getSeconds()).padStart(2, '0')}.000 — ${initialDate.getFullYear()}/${String(initialDate.getMonth() + 1).padStart(2, '0')}/${String(initialDate.getDate()).padStart(2, '0')}`,
          status: 'VERIFIED',
        };
        items = [defaultItem];
      }
      setDeclarations(items);
    };

    loadRecords();

    const handleNewRecord = () => loadRecords();
    const handleExpandLegal = () => setIsExpanded(true);
    window.addEventListener('radar-legal-declaration-recorded', handleNewRecord);
    window.addEventListener('radar_navigate_to_legal_record', handleExpandLegal);
    return () => {
      window.removeEventListener('radar-legal-declaration-recorded', handleNewRecord);
      window.removeEventListener('radar_navigate_to_legal_record', handleExpandLegal);
    };
  }, [user?.uid, user?.serial_id, (user as any)?.created_at, isArabic]);

  const userRole = ((user as any)?.role || '').toLowerCase();
  const isCaptain = userRole === 'driver' || userRole === 'captain';

  return (
    <Card className={styles.card} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.accentBar} />
      <CardHeader className={styles.header}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
          className={styles.headerButton}
        >
          <div className={styles.headerRow}>
            {/* Top on Mobile: Icon + Full Title */}
            <div className={styles.headerInfo}>
              <div className={styles.iconBox}>
                <FileCheck2 className={styles.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className={styles.title}>
                  {isArabic ? 'السجل القانوني الإلكتروني' : 'Electronic Legal Log'}
                </CardTitle>
                <CardDescription className={styles.descDesktop}>
                  {isArabic
                    ? 'سجل توثيق إقرارات صحة البيانات والموافقات الرسمية'
                    : 'Certified log of personal declarations & legal deeds'}
                </CardDescription>
              </div>
            </div>

            {/* Bottom on Mobile: Subtitle + Badge + Chevron */}
            <div className={styles.actionsRow}>
              <CardDescription className={styles.descMobile}>
                {isArabic
                  ? 'سجل إقرارات صحة البيانات والموافقات'
                  : 'Certified log of declarations & deeds'}
              </CardDescription>

              <div className={styles.actionsGroup}>
                <span className={styles.countBadge}>
                  {declarations.length} {isArabic ? 'إقرار موثق' : 'verified deeds'}
                </span>
                <div className={styles.chevronBox}>
                  <ChevronDown className={cn(styles.chevronIcon, isExpanded && styles.chevronRotated)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className={styles.content}>
          {declarations.length === 0 ? (
            <div className={styles.emptyBox}>
              <ShieldAlert className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>{isArabic ? 'لا توجد إقرارات مسجلة' : 'No declarations found'}</p>
              <p className={styles.emptyDesc}>
                {isArabic
                  ? 'يتم توثيق وحفظ أي إقرار قانوني يتم تأكيده عند التسجيل أو تعديل بيانات الحساب هنا تلقائياً.'
                  : 'All legal deeds signed at registration or profile edits will be timestamped here.'}
              </p>
            </div>
          ) : (
            <div className={styles.list}>
              {declarations.map((item) => (
                <LegalDeclarationCard key={item.id} item={item} isArabic={isArabic} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
