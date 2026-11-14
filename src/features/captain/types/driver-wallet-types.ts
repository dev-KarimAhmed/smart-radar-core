export interface CaptainReceiptItem {
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

export interface EffectivePaymentChannel {
  id: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  accountNumber: string;
  accountHolder?: string;
}

export interface EffectiveFinancialDelegate {
  name: string;
  phone: string;
  whatsapp: string;
  areaBadge?: string;
  hint?: string;
}

export function formatReceiptDate(isoString: string, language: 'ar' | 'en'): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
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

export function toHoursMinutes(totalMinutes: number): { hours: number; minutes: number } {
  const safeMinutes = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  return { hours: Math.floor(safeMinutes / 60), minutes: safeMinutes % 60 };
}
