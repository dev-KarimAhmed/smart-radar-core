import { NextResponse } from 'next/server';
import { hasAdminPermission, hasAdminSectorAccess, verifyAdminCaller } from '@/lib/admin-auth-verifier';
import {
  fetchWalletOverview,
  fetchWalletReceipts,
  fetchWalletVouchers,
  fetchWalletLedger,
} from '@/features/admin/services/wallet/admin-wallet-queries';
import {
  handleApproveReceipt,
  handleRejectReceipt,
} from '@/features/admin/services/wallet/admin-wallet-mutations';
import {
  handleDirectTopup,
  handleGenerateVouchers,
  handleToggleSelfTopup,
  handleSendWalletMessage,
} from '@/features/admin/services/wallet/admin-wallet-operations';

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }
  if (!hasAdminSectorAccess(admin, 'wallet')) {
    return NextResponse.json({ success: false, error: 'غير مصرح: لا تملك صلاحية قطاع المحفظة' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'overview';
  const requiredViewPerm =
    view === 'receipts' ? 'wallet.receipts' : view === 'vouchers' ? 'wallet.vouchers' : 'wallet.overview';
  if (!hasAdminPermission(admin, requiredViewPerm)) {
    return NextResponse.json({ success: false, error: 'غير مصرح: لا تملك صلاحية عرض هذا القسم' }, { status: 403 });
  }

  try {
    switch (view) {
      case 'overview':
        return await fetchWalletOverview();
      case 'receipts':
        return await fetchWalletReceipts();
      case 'vouchers':
        return await fetchWalletVouchers();
      case 'ledger':
        return await fetchWalletLedger();
      default:
        return NextResponse.json({ success: false, error: 'Unknown view' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Wallet API] GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'بيانات غير صالحة (Invalid JSON)' }, { status: 400 });
  }

  const { action } = body || {};

  const actionPermMap: Record<string, string> = {
    approve_receipt: 'wallet.receipts',
    reject_receipt: 'wallet.receipts',
    direct_topup: 'wallet.direct_topup',
    generate_vouchers: 'wallet.vouchers',
    toggle_self_topup: 'wallet.settings',
    send_message: 'wallet.settings',
  };
  const requiredPerm = actionPermMap[action];
  if (!hasAdminSectorAccess(admin, 'wallet') || (requiredPerm && !hasAdminPermission(admin, requiredPerm))) {
    return NextResponse.json({ success: false, error: 'غير مصرح: لا تملك الصلاحية الفرعية لتنفيذ هذا الإجراء المالي' }, { status: 403 });
  }

  try {
    switch (action) {
      case 'approve_receipt':
        return await handleApproveReceipt(body, admin);
      case 'reject_receipt':
        return await handleRejectReceipt(body, admin);
      case 'direct_topup':
        return await handleDirectTopup(body, admin);
      case 'generate_vouchers':
        return await handleGenerateVouchers(body);
      case 'toggle_self_topup':
        return await handleToggleSelfTopup(body);
      case 'send_message':
        return await handleSendWalletMessage(body);
      default:
        return NextResponse.json({ success: false, error: `إجراء غير معروف: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Wallet API] POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server mutation error' }, { status: 500 });
  }
}

export * from '@/features/admin/services/wallet/admin-wallet-helpers';
export * from '@/features/admin/services/wallet/admin-wallet-queries';
export * from '@/features/admin/services/wallet/admin-wallet-mutations';
export * from '@/features/admin/services/wallet/admin-wallet-operations';
