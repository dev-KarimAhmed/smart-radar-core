import React from 'react';
import { ShieldCheck, Clock, FileCheck2, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LegalDeclarationRecord } from '@/features/account/services/legal-log-service';
import { legalDeclarationsStyles as styles } from './legal-declarations-styles';
import { getLocalizedActionLabel, getLocalizedDeclarationText } from './legal-declarations-helpers';

interface LegalDeclarationCardProps {
  item: LegalDeclarationRecord;
  isArabic: boolean;
}

export function LegalDeclarationCard({ item, isArabic }: LegalDeclarationCardProps) {
  return (
    <div className={styles.itemCard}>
      {/* Meta row: Action, Status Badge & IDs */}
      <div className={styles.metaRow}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(styles.badgeAction, item.actionType === 'ADMIN_NOTIFICATION' && 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300')}>
            {item.actionType === 'ADMIN_NOTIFICATION' ? (
              <Bell className="h-3 w-3 text-cyan-400" />
            ) : (
              <FileCheck2 className="h-3 w-3" />
            )}
            <span>{getLocalizedActionLabel(item, isArabic)}</span>
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
          {getLocalizedDeclarationText(item, isArabic)}
        </p>
      </div>
    </div>
  );
}
