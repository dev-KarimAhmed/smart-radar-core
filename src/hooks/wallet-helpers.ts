export interface ServerWalletSnapshot {
  balance: number;
  paidMinutesRemaining: number;
  bonusMinutesRemaining: number;
  subscriptionHours: number;
  activePackageName: string;
  timeBundleExpiresAt: string | null;
  transactions: WalletTransaction[];
}

export type WalletLoadState = 'idle' | 'loading' | 'ready' | 'missing' | 'error';

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  status: string;
  timestamp: number;
}

export interface SubmitWalletReceiptInput {
  amount: number;
  channel: string;
  receiptFile: File;
}

export interface DelegateChargeInput {
  captainId: string;
  amount: number;
  description?: string;
}

export function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return 0;
}

export function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function parseTimestamp(value: unknown): number {
  if (typeof value === 'number') return value;
  if ((value as any)?.seconds) return (value as any).seconds * 1000;
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function mapWalletTransactionRow(
  row: Record<string, any>,
  tAuto: (key: string) => string,
  isArabic = true
): WalletTransaction {
  const timestamp = parseTimestamp(row.created_at ?? row.createdAt ?? row.timestamp);
  return {
    id: String(row.id),
    type: row.type || row.transaction_type || 'transaction',
    amount: firstNumber(row.amount, 0),
    currency: isArabic
      ? firstString(row.currency_ar, row.currency, row.currency_code, '')
      : firstString(row.currency_en, row.currency_code, row.currency, row.currency_ar, ''),
    description: firstString(
      isArabic ? row.description_ar : row.description_en,
      row.description,
      row.description_ar,
      row.memo,
      tAuto('transactionOnBalance')
    ),
    createdAt: timestamp
      ? new Date(timestamp).toLocaleString(isArabic ? 'ar' : 'en', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        })
      : '',
    status: row.status || 'completed',
    timestamp: timestamp || Date.now(),
  };
}

export function mapWalletAccountRow(
  row: Record<string, any> | null,
  transactions: WalletTransaction[] = []
): ServerWalletSnapshot | null {
  if (!row) return null;
  const paidMinutes = firstNumber(row.paid_minutes_remaining, 0);
  const bonusMinutes = firstNumber(row.bonus_minutes_remaining, 0);

  return {
    balance: firstNumber(row.balance, 0),
    paidMinutesRemaining: paidMinutes,
    bonusMinutesRemaining: bonusMinutes,
    subscriptionHours: Number(((paidMinutes + bonusMinutes) / 60).toFixed(3)),
    activePackageName: firstString(row.active_package_name, ''),
    timeBundleExpiresAt: firstString(row.time_bundle_expires_at, '') || null,
    transactions,
  };
}
