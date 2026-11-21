import React, { useState } from 'react';
import { ShieldCheck, Clock, FileCheck2, Bell, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LegalDeclarationRecord } from '@/features/account/services/legal-log-service';
import { legalDeclarationsStyles as styles } from './legal-declarations-styles';
import { getLocalizedActionLabel, getLocalizedDeclarationText } from './legal-declarations-helpers';
import { getClientAccessToken } from '@/shared/services/supabase-auth-headers';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';

interface LegalDeclarationCardProps {
  item: LegalDeclarationRecord;
  isArabic: boolean;
}

export function LegalDeclarationCard({ item, isArabic }: LegalDeclarationCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const accessToken = (await getClientAccessToken()) || undefined;
      const downloadUrl = `/api/captain/contract?download=true&captainId=${encodeURIComponent(item.userId)}&_t=${Date.now()}`;
      const filename = `وثيقة_الإقرار_${item.id}.pdf`;
      await downloadPdfInWorker({ url: downloadUrl, filename, accessToken });
    } catch (err) {
      console.warn('PDF download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

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

      {/* Download Document Action */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-end">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
              <span>{isArabic ? 'جاري التحميل...' : 'Downloading...'}</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 text-amber-400" />
              <span>{isArabic ? 'تحميل الوثيقة الرسمية (PDF)' : 'Download Official Document (PDF)'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
