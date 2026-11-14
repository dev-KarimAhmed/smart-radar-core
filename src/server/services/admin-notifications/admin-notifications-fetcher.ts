import { supabaseAdmin } from '@/lib/supabase-admin';
import { encodeNotificationPayload } from '@/shared/utils/notification-i18n';
import { AdminNotificationItem, AdminNotificationsSummary } from './admin-notifications-types';

export async function fetchAdminNotifications(adminId: string): Promise<{
  summary: AdminNotificationsSummary;
  notifications: AdminNotificationItem[];
}> {
  // 1. Fetch pending receipts
  const { data: rawReceipts } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(50);

  const pendingReceipts = rawReceipts || [];
  const receiptProfileIds = Array.from(new Set(pendingReceipts.map((r) => r.profile_id).filter(Boolean)));

  // 2. Fetch pending captains
  const { data: rawCaptains } = await supabaseAdmin
    .from('captain_profiles')
    .select('id, nickname, plate_number, vehicle_brand, vehicle_model, vehicle_color, vehicle_year, created_at, verification_status')
    .eq('verification_status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(30);

  const pendingCaptains = rawCaptains || [];
  const captainProfileIds = Array.from(new Set(pendingCaptains.map((c) => c.id).filter(Boolean)));

  // 3. Fetch pending password resets
  const { data: rawResets } = await supabaseAdmin
    .from('password_reset_requests')
    .select('id, claimed_phone, profile_id, status, created_at')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(20);

  const pendingResets = rawResets || [];

  // 4. Fetch system / direct admin notifications
  const { data: rawSystemNotifs } = await supabaseAdmin
    .from('user_notifications')
    .select('*')
    .or(`user_id.eq.${adminId},type.in.(system,alert,emergency,complaint)`)
    .order('created_at', { ascending: false })
    .limit(30);

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
      if (tx.receipt_path) {
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
      const captainNameEn = prof.full_name || 'Radar Captain';
      const captainPhone = prof.phone || '-';
      const channelName = tx.payment_channel || 'قناة دفع رقمية';
      const channelNameEn = tx.payment_channel || 'Digital Payment Channel';
      const amountNum = Number(tx.amount || 0);
      const encodedReceipt = encodeNotificationPayload(
        `إيصال شحن جديد بحاجة للمراجعة (${amountNum} ${fallbackCurrency})`,
        `أرسل الكابتن المعلن ${captainName} (${captainPhone}) إيصال شحن بقيمة ${amountNum} ${fallbackCurrency} عبر ${channelName}.`,
        `New Recharge Receipt Pending Review (${amountNum} ${fallbackCurrencyCode})`,
        `Captain ${captainNameEn} (${captainPhone}) submitted a recharge receipt of ${amountNum} ${fallbackCurrencyCode} via ${channelNameEn}.`
      );

      return {
        id: `rcpt_${tx.id}`,
        category: 'RECEIPT',
        title: encodedReceipt.title,
        description: encodedReceipt.description,
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
    const captainNameEn = prof.full_name || cap.nickname || 'New Captain';
    const captainPhone = prof.phone || '-';
    const encodedCaptain = encodeNotificationPayload(
      `كابتن معلن جديد بانتظار مراجعة المستندات والتحقق`,
      `انضم الكابتن المعلن ${captainName} (${captainPhone}) للأسطول وبانتظار اعتماد رخصة القيادة والسيارة.`,
      `New Captain Pending Document Verification`,
      `Captain ${captainNameEn} (${captainPhone}) joined the fleet and is awaiting driver's license & vehicle verification.`
    );

    return {
      id: `cap_${cap.id}`,
      category: 'CAPTAIN',
      title: encodedCaptain.title,
      description: encodedCaptain.description,
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
    const encodedReset = encodeNotificationPayload(
      `طلب استرجاع كلمة مرور معلق`,
      `طلب استعادة وتعيين كلمة مرور جديدة للحساب المسجل برقم الهاتف (${rst.claimed_phone}).`,
      `Pending Password Reset Request`,
      `Password reset requested for account registered with phone (${rst.claimed_phone}).`
    );
    return {
      id: `rst_${rst.id}`,
      category: 'PASSWORD_RESET',
      title: encodedReset.title,
      description: encodedReset.description,
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

  return {
    summary: {
      totalUnread,
      pendingReceiptsCount: receiptItems.length,
      pendingCaptainsCount: captainItems.length,
      pendingResetsCount: resetItems.length,
      unreadSystemCount,
    },
    notifications: allNotifications,
  };
}
