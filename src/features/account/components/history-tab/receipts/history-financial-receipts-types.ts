export interface FinancialReceiptRecord {
  id: string;
  amount: number;
  currencyAr: string;
  currencyCode: string;
  channel: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  receiptPath: string | null;
  signedImageUrl: string | null;
  descriptionAr?: string;
  rejectReason?: string | null;
  adminNote?: string | null;
  creditType?: 'MINUTES' | 'CASH' | null;
  minutesCredited?: number | null;
  amountCredited?: number | null;
}

export function formatReceiptDate(isoString: string, isArabic = true) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export const styles = {
  card: 'relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white',
  accentBar: 'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.5)]',
  header: 'p-4 sm:p-5 pb-3.5 sm:pb-3',
  headerButton: 'w-full text-right cursor-pointer select-none transition-colors hover:bg-white/[0.02]',
  headerRow: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3',
  headerInfo: 'flex items-center gap-3 min-w-0',
  iconBox: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  icon: 'h-5 w-5',
  title: 'text-base font-black text-white font-sans',
  descDesktop: 'hidden sm:block text-xs text-slate-400 mt-0.5 leading-relaxed font-sans',
  descMobile: 'sm:hidden text-xs text-slate-400 leading-relaxed font-sans truncate min-w-0 flex-1',
  actionsRow: 'flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-white/[0.05] sm:border-0 shrink-0',
  actionsGroup: 'flex items-center gap-2 shrink-0',
  countBadge: 'shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 py-1 text-xs font-bold text-emerald-300 shadow-sm font-mono',
  chevronBox: 'flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 transition-all hover:bg-emerald-500/20 shrink-0',
  chevronIcon: 'h-4 w-4 transition-transform duration-200',
  chevronRotated: 'rotate-180',
  content: 'p-5 pt-2',
  emptyBox: 'rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center flex flex-col items-center justify-center gap-2.5 my-2',
  emptyIcon: 'h-8 w-8 text-slate-500',
  emptyTitle: 'text-xs font-semibold text-slate-400',
  emptyDesc: 'text-[11px] text-slate-500 leading-normal max-w-sm',
  list: 'space-y-3 max-h-[480px] overflow-y-auto pr-1',
  itemCard: 'group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-4 transition-all hover:border-emerald-500/30 space-y-3',
} as const;

