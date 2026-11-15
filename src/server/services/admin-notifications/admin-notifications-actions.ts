import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { handleApproveReceipt } from './admin-receipt-approval';
import { handleRejectReceipt } from './admin-receipt-rejection';

export async function handleAdminNotificationAction(adminId: string, body: any): Promise<NextResponse> {
  const { action } = body;

  if (action === 'APPROVE_RECEIPT') {
    return handleApproveReceipt(adminId, body);
  }

  if (action === 'REJECT_RECEIPT') {
    return handleRejectReceipt(adminId, body);
  }

  if (action === 'MARK_ALL_READ') {
    await supabaseAdmin
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', adminId)
      .eq('is_read', false);

    return NextResponse.json({ success: true, message: 'تم تعليم جميع الإشعارات كمقروءة.' });
  }

  return NextResponse.json({ success: false, error: 'إجراء غير مدعوم' }, { status: 400 });
}
