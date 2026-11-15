import { adminFetch } from '@/features/admin/lib/admin-api-client';
import type {
  WalletOverview,
  ReceiptItem,
  VoucherItem,
  LedgerItem,
  CaptainOption,
} from '@/features/admin/types/admin-wallet';

export async function fetchWalletOverview(): Promise<WalletOverview> {
  const res = await adminFetch('/api/admin/wallet?view=overview');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load wallet overview');
  }
  return data.overview;
}

export async function fetchWalletReceipts(): Promise<ReceiptItem[]> {
  const res = await adminFetch('/api/admin/wallet?view=receipts');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load receipts');
  }
  return data.receipts || [];
}

export async function fetchWalletVouchers(): Promise<VoucherItem[]> {
  const res = await adminFetch('/api/admin/wallet?view=vouchers');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load vouchers');
  }
  return data.vouchers || [];
}

export async function fetchWalletLedger(): Promise<LedgerItem[]> {
  const res = await adminFetch('/api/admin/wallet?view=ledger');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load ledger');
  }
  return data.ledger || [];
}

export async function fetchCaptainsForTopup(): Promise<CaptainOption[]> {
  const res = await adminFetch('/api/admin/users?role=CAPTAIN');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load captains');
  }
  return data.users || [];
}

export async function approveReceiptAction(params: {
  transactionId: string;
  creditType: 'CASH' | 'MINUTES';
  minutesToGrant: number;
  adminNote: string;
}): Promise<string> {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'approve_receipt',
      ...params,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to approve receipt');
  }
  return data.message;
}

export async function rejectReceiptAction(params: {
  transactionId: string;
  reason: string;
}): Promise<string> {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'reject_receipt',
      ...params,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reject receipt');
  }
  return data.message;
}

export async function directTopupAction(params: {
  captainId: string;
  cashAmount: number;
  minutes: number;
  extendDays: number;
  note: string;
}): Promise<string> {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'direct_topup',
      ...params,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to execute direct top-up');
  }
  return data.message;
}

export async function generateVouchersAction(params: {
  count: number;
  minutesValue: number;
}): Promise<string> {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'generate_vouchers',
      ...params,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate vouchers');
  }
  return data.message;
}

export async function toggleSelfTopupAction(enabled: boolean): Promise<string> {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'toggle_self_topup',
      enabled,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to toggle self top-up');
  }
  return data.message;
}

export async function sendReceiptMessageAction(params: {
  captainId: string;
  title: string;
  message: string;
  type: string;
}): Promise<string> {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'send_message',
      ...params,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to send message');
  }
  return data.message;
}

