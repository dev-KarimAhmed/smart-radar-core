import { NextResponse } from 'next/server';
import { verifyAdminCaller } from '@/lib/admin-auth-verifier';
import {
  type AdminNotificationItem,
  type AdminNotificationsSummary,
} from '@/server/services/admin-notifications/admin-notifications-types';
import { fetchAdminNotifications } from '@/server/services/admin-notifications/admin-notifications-fetcher';
import { handleAdminNotificationAction } from '@/server/services/admin-notifications/admin-notifications-actions';

export type { AdminNotificationItem, AdminNotificationsSummary };

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  try {
    const { summary, notifications } = await fetchAdminNotifications(admin.id);
    return NextResponse.json({
      success: true,
      summary,
      notifications,
    });
  } catch (error: any) {
    console.error('[Admin Notifications Error]:', error);
    return NextResponse.json({ success: false, error: error?.message || 'فشل جلب إشعارات المشرف.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    return await handleAdminNotificationAction(admin.id, body);
  } catch (error: any) {
    console.error('[Admin Notifications POST Error]:', error);
    return NextResponse.json({ success: false, error: error?.message || 'فشلت معالجة الإشعار' }, { status: 500 });
  }
}
