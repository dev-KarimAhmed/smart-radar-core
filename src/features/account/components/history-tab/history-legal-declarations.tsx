'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ShieldCheck, Clock, FileCheck2, UserCheck, ShieldAlert, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  getStoredLegalDeclarations,
  type LegalDeclarationRecord,
  LEGAL_DECLARATION_TEXT,
} from '../../services/legal-log-service';

const styles = {
  card: 'relative overflow-hidden rounded-3xl border border-amber-500/25 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white',
  accentBar: 'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.5)]',
  header: 'p-4 sm:p-5 pb-3.5 sm:pb-3',
  headerButton: 'w-full text-right cursor-pointer select-none transition-colors hover:bg-white/[0.02]',
  headerRow: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3',
  headerInfo: 'flex items-center gap-3 min-w-0',
  iconBox: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  icon: 'h-5 w-5',
  title: 'text-base font-black text-white font-sans',
  descDesktop: 'hidden sm:block text-xs text-slate-400 mt-0.5 leading-relaxed font-sans',
  descMobile: 'sm:hidden text-xs text-slate-400 leading-relaxed font-sans truncate min-w-0 flex-1',
  actionsRow: 'flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-white/[0.05] sm:border-0 shrink-0',
  actionsGroup: 'flex items-center gap-2 shrink-0',
  countBadge: 'shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 sm:px-3 py-1 text-xs font-bold text-amber-300 shadow-sm font-mono',
  chevronBox: 'flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 transition-all hover:bg-amber-500/20 shrink-0',
  chevronIcon: 'h-4 w-4 transition-transform duration-200',
  chevronRotated: 'rotate-180',
  content: 'p-5 pt-2',
  emptyBox: 'rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center flex flex-col items-center justify-center gap-2.5 my-2',
  emptyIcon: 'h-8 w-8 text-slate-500',
  emptyTitle: 'text-xs font-semibold text-slate-400',
  emptyDesc: 'text-[11px] text-slate-500 leading-normal max-w-sm',
  list: 'space-y-3.5 max-h-[500px] overflow-y-auto pr-1',
  itemCard: 'group relative rounded-2xl border border-amber-500/20 bg-gradient-to-b from-white/[0.03] to-transparent p-4 transition-all hover:border-amber-500/40 space-y-3',
  metaRow: 'flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5',
  badgeConfirmed: 'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-black text-emerald-300 shadow-sm',
  badgeAction: 'inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-300',
  idGroup: 'flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono',
  timeRow: 'flex items-center gap-1.5 text-xs text-slate-400 font-mono',
  textCard: 'rounded-xl border border-white/5 bg-black/40 p-3 text-xs leading-relaxed text-amber-100/90 font-medium',
} as const;

interface HistoryLegalDeclarationsProps {
  isArabic?: boolean;
}

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
    window.addEventListener('radar-legal-declaration-recorded', handleNewRecord);
    return () => window.removeEventListener('radar-legal-declaration-recorded', handleNewRecord);
  }, [user?.uid, user?.serial_id, (user as any)?.created_at, isArabic]);

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
                <div key={item.id} className={styles.itemCard}>
                  {/* Meta row: Action, Status Badge & IDs */}
                  <div className={styles.metaRow}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(styles.badgeAction, item.actionType === 'ADMIN_NOTIFICATION' && 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300')}>
                        {item.actionType === 'ADMIN_NOTIFICATION' ? (
                          <Bell className="h-3 w-3 text-cyan-400" />
                        ) : (
                          <FileCheck2 className="h-3 w-3" />
                        )}
                        <span>{item.actionLabel}</span>
                      </span>

                      <span className={styles.badgeConfirmed}>
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{isArabic ? 'معتمد وموثق رقمياً 🛡️' : 'Digitally Certified'}</span>
                      </span>
                    </div>

                    <div className={styles.timeRow}>
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>{item.preciseTime}</span>
                    </div>
                  </div>

                  {/* ID details row */}
                  <div className={styles.idGroup}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">{isArabic ? 'رقم الإقرار:' : 'Deed ID:'}</span>
                      <span className="text-amber-300 font-bold">{item.id}</span>
                    </div>

                    <span className="text-white/20">|</span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">{isArabic ? 'رقم المستخدم في النظام:' : 'User Serial ID:'}</span>
                      <span className="text-[#14F5D5] font-bold">{item.userSerialId}</span>
                    </div>
                  </div>

                  {/* Legal Deed Text */}
                  <div className={styles.textCard}>
                    <p className="text-amber-100/90 leading-relaxed font-sans text-xs sm:text-[13px]">
                      {item.declarationText}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
