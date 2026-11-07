import { adminFetch } from '@/features/admin/lib/admin-api-client';

export async function approveReceiptAction(params: {
  transactionId: string;
  creditType: 'CASH' | 'MINUTES';
  minutesToGrant: number;
  adminNote: string;
}) {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'approve_receipt',
      transactionId: params.transactionId,
      creditType: params.creditType,
      minutesToGrant: params.creditType === 'MINUTES' ? params.minutesToGrant : 0,
      adminNote: params.adminNote,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to approve receipt');
  }
  return data;
}

export async function rejectReceiptAction(params: {
  transactionId: string;
  reason: string;
}) {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'reject_receipt',
      transactionId: params.transactionId,
      reason: params.reason,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reject receipt');
  }
  return data;
}

export async function directTopupAction(params: {
  captainId: string;
  cashAmount: number;
  minutes: number;
  extendDays: number;
  note: string;
}) {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'direct_topup',
      captainId: params.captainId,
      cashAmount: params.cashAmount,
      minutes: params.minutes,
      extendDays: params.extendDays,
      note: params.note,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Direct top-up failed');
  }
  return data;
}

export async function generateVouchersAction(params: {
  count: number;
  minutesValue: number;
}) {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'generate_vouchers',
      count: params.count,
      minutesValue: params.minutesValue,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate vouchers');
  }
  return data;
}

export async function toggleSelfTopupAction(enabled: boolean) {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'toggle_self_topup',
      enabled,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to toggle self top-up state');
  }
  return data;
}

export async function sendReceiptMessageAction(params: {
  captainId: string;
  title: string;
  message: string;
  type: string;
}) {
  const res = await adminFetch('/api/admin/wallet', {
    method: 'POST',
    body: JSON.stringify({
      action: 'send_message',
      captainId: params.captainId,
      title: params.title,
      message: params.message,
      type: params.type,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to send message');
  }
  return data;
}
