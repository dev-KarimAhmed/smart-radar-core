import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  verifyAdminCaller,
  hasAdminSectorAccess,
  getAdminRank,
} from '@/lib/admin-auth-verifier';
import { isValidStorageRelativePath } from '@/shared/server/api-auth-guard';
import {
  sendCaptainNotification,
  handleApproveReceipt,
  handleRejectReceipt,
} from './notification-receipt-actions';

export {
  sendCaptainNotification,
  handleApproveReceipt,
  handleRejectReceipt,
} from './notification-receipt-actions';

export interface AdminNotificationItem {
  id: string;
  category: 'RECEIPT' | 'CAPTAIN' | 'PASSWORD_RESET' | 'SYSTEM';
  title: string;
  description: string;
  createdAt: string;
  severity: 'urgent' | 'warning' | 'info';
  targetTab: 'wallet' | 'captains' | 'riders' | 'admins';
  targetSubtab?: string;
  isRead: boolean;
  payload: {
    transactionId?: string;
    profileId?: string;
    amount?: number;
    currency?: string;
    currencyCode?: string;
    channel?: string;
    receiptPath?: string;
    receiptImageUrl?: string | null;
    captainName?: string;
    captainPhone?: string;
    captainSerial?: string;
    governorate?: string;
    district?: string;
    captainId?: string;
    plateNumber?: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    claimedPhone?: string;
    adminNote?: string;
  };
}

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  try {
    const isGeneral = getAdminRank(admin) === 'GENERAL_ADMIN';
    const canViewWallet = isGeneral || hasAdminSectorAccess(admin, 'wallet');
    const canViewCaptains = isGeneral || hasAdminSectorAccess(admin, 'captains');
    const canViewResets = isGeneral || hasAdminSectorAccess(admin, 'captains') || hasAdminSectorAccess(admin, 'riders');

    // 1. Fetch pending receipts (wallet sector)
    const { data: rawReceipts } = canViewWallet
      ? await supabaseAdmin
          .from('wallet_transactions')
          .select('*')
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false })
          .limit(50)
      : { data: [] as any[] };

    const pendingReceipts = rawReceipts || [];
    const receiptProfileIds = Array.from(new Set(pendingReceipts.map((r) => r.profile_id).filter(Boolean)));

    // 2. Fetch pending captains (captains sector)
    const { data: rawCaptains } = canViewCaptains
      ? await supabaseAdmin
          .from('captain_profiles')
          .select('id, nickname, plate_number, vehicle_brand, vehicle_model, vehicle_color, vehicle_year, created_at, verification_status')
          .eq('verification_status', 'PENDING')
          .order('created_at', { ascending: false })
          .limit(30)
      : { data: [] as any[] };

    const pendingCaptains = rawCaptains || [];
    const captainProfileIds = Array.from(new Set(pendingCaptains.map((c) => c.id).filter(Boolean)));

    // 3. Fetch pending password resets
    const { data: rawResets } = canViewResets
      ? await supabaseAdmin
          .from('password_reset_requests')
          .select('id, claimed_phone, profile_id, status, created_at')
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false })
          .limit(20)
      : { data: [] as any[] };

    const pendingResets = rawResets || [];

    // 4. Fetch system / direct admin notifications
    const sysNotifQuery = supabaseAdmin
      .from('user_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    const { data: rawSystemNotifs } = isGeneral
      ? await sysNotifQuery.or(`user_id.eq.${admin.id},type.in.(alert,emergency,complaint)`)
      : await sysNotifQuery.eq('user_id', admin.id);

    const systemNotifs = rawSystemNotifs || [];

    // Gather all profile IDs to resolve names and phones in 1 query
    const allProfileIds = Array.from(new Set([...receiptProfileIds, ...captainProfileIds]));
    let profilesMap = new Map();
    let govMap = new Map();
    let distMap = new Map();
    let countriesMap = new Map();

    if (allProfileIds.length > 0) {
      const [profilesRes, govRes, distRes, countriesRes] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('id, full_name, phone, serial_id, governorate_id, district_id, country_id')
          .in('id', allProfileIds),
        supabaseAdmin.from('governorates').select('id, name_ar'),
        supabaseAdmin.from('districts').select('id, name_ar'),
        supabaseAdmin.from('countries').select('id, currency_ar, currency_en, name_ar'),
      ]);

      profilesMap = new Map((profilesRes.data || []).map((p) => [p.id, p]));
      govMap = new Map((govRes.data || []).map((g) => [g.id, g.name_ar]));
      distMap = new Map((distRes.data || []).map((d) => [d.id, d.name_ar]));
      countriesMap = new Map((countriesRes.data || []).map((c) => [c.id, c]));
    }

    // Build signed URLs for pending receipt images
    const receiptItems: AdminNotificationItem[] = await Promise.all(
      pendingReceipts.map(async (tx) => {
        const prof = profilesMap.get(tx.profile_id) || {};
        const country = prof.country_id ? countriesMap.get(prof.country_id) : null;
        const isEgypt = prof.country_id === 2 || String(prof.phone || '').startsWith('+20');
        const fallbackCurrency = tx.currency_ar || country?.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');
        const fallbackCurrencyCode = tx.currency_code || country?.currency_en || (isEgypt ? 'EGP' : 'JOD');

        let signedImageUrl: string | null = null;
        if (tx.receipt_path && isValidStorageRelativePath(tx.receipt_path)) {
          try {
            const { data: signData } = await supabaseAdmin.storage
              .from('receipts')
              .createSignedUrl(tx.receipt_path, 3600);
            signedImageUrl = signData?.signedUrl || null;
          } catch (signErr) {
            console.warn('[Admin Notifications] Signed URL error:', signErr);
          }
        }

        const captainName = prof.full_name || 'كابتن معلن رادار';
        const captainPhone = prof.phone || '-';
        const channelName = tx.payment_channel || 'قناة دفع رقمية';
        const amountNum = Number(tx.amount || 0);

        return {
          id: `rcpt_${tx.id}`,
          category: 'RECEIPT',
          title: `إيصال شحن جديد بحاجة للمراجعة (${amountNum} ${fallbackCurrency})`,
          description: `أرسل الكابتن المعلن ${captainName} (${captainPhone}) إيصال شحن بقيمة ${amountNum} ${fallbackCurrency} عبر ${channelName}.`,
          createdAt: tx.created_at,
          severity: 'urgent',
          targetTab: 'wallet',
          targetSubtab: 'receipts',
          isRead: false,
          payload: {
            transactionId: tx.id,
            profileId: tx.profile_id,
            amount: amountNum,
            currency: fallbackCurrency,
            currencyCode: fallbackCurrencyCode,
            channel: channelName,
            receiptPath: tx.receipt_path,
            receiptImageUrl: signedImageUrl,
            captainName,
            captainPhone,
            captainSerial: prof.serial_id || '',
            governorate: govMap.get(prof.governorate_id) || '',
            district: distMap.get(prof.district_id) || '',
          },
        };
      })
    );

    // Build captain verification notification items
    const captainItems: AdminNotificationItem[] = pendingCaptains.map((cap) => {
      const prof = profilesMap.get(cap.id) || {};
      const captainName = prof.full_name || cap.nickname || 'كابتن معلن جديد';
      const captainPhone = prof.phone || '-';

      return {
        id: `cap_${cap.id}`,
        category: 'CAPTAIN',
        title: `كابتن معلن جديد بانتظار مراجعة المستندات والتحقق`,
        description: `انضم الكابتن المعلن ${captainName} (${captainPhone}) للأسطول وبانتظار اعتماد رخصة القيادة والسيارة.`,
        createdAt: cap.created_at || new Date().toISOString(),
        severity: 'warning',
        targetTab: 'captains',
        isRead: false,
        payload: {
          captainId: cap.id,
          captainName,
          captainPhone,
          plateNumber: cap.plate_number || '',
          vehicleBrand: cap.vehicle_brand || '',
          vehicleModel: cap.vehicle_model || '',
        },
      };
    });

    // Build password reset notification items
    const resetItems: AdminNotificationItem[] = pendingResets.map((rst) => {
      return {
        id: `rst_${rst.id}`,
        category: 'PASSWORD_RESET',
        title: `طلب استرجاع كلمة مرور معلق`,
        description: `طلب استعادة وتعيين كلمة مرور جديدة للحساب المسجل برقم الهاتف (${rst.claimed_phone}).`,
        createdAt: rst.created_at,
        severity: 'warning',
        targetTab: 'wallet',
        isRead: false,
        payload: {
          claimedPhone: rst.claimed_phone,
          profileId: rst.profile_id,
        },
      };
    });

    // Build system notification items
    const systemItems: AdminNotificationItem[] = systemNotifs.map((sys) => {
      const isUrgent = sys.type === 'emergency' || sys.type === 'alert' || sys.type === 'complaint';
      return {
        id: `sys_${sys.id}`,
        category: 'SYSTEM',
        title: sys.title || 'إشعار إداري سيادي',
        description: sys.description || '',
        createdAt: sys.created_at,
        severity: isUrgent ? 'urgent' : 'info',
        targetTab: 'wallet',
        isRead: Boolean(sys.is_read),
        payload: {
          adminNote: sys.description,
        },
      };
    });

    // Merge and sort chronologically (newest first)
    const allNotifications: AdminNotificationItem[] = [
      ...receiptItems,
      ...captainItems,
      ...resetItems,
      ...systemItems,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadSystemCount = systemItems.filter((s) => !s.isRead).length;
    const totalUnread = receiptItems.length + captainItems.length + resetItems.length + unreadSystemCount;

    return NextResponse.json({
      success: true,
      summary: {
        totalUnread,
        pendingReceiptsCount: receiptItems.length,
        pendingCaptainsCount: captainItems.length,
        pendingResetsCount: resetItems.length,
        unreadSystemCount,
      },
      notifications: allNotifications,
    });
  } catch (error: any) {
    console.error('[Admin Notifications Error]:', error);
    return NextResponse.json({ success: false, error: 'فشل جلب إشعارات المشرف.' }, { status: 500 });
  }
}


