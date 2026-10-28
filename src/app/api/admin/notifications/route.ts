import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller } from '@/lib/admin-auth-verifier';

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

async function sendCaptainNotification(userId: string, id: string, title: string, description: string, type: string) {
  try {
    const notifId = `${id}_${Date.now()}`;
    await supabaseAdmin.from('user_notifications').insert({
      id: notifId,
      user_id: userId,
      title,
      description,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Admin Notifications] Failed to send notification to user:', err);
  }
}

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  try {
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
      .or(`user_id.eq.${admin.id},type.in.(system,alert,emergency,complaint)`)
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
      const vehicleDesc = [cap.vehicle_brand, cap.vehicle_model, cap.vehicle_color, cap.vehicle_year]
        .filter(Boolean)
        .join(' - ');

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
    const { action } = body;

    // 1. APPROVE RECEIPT directly from notification center
    if (action === 'APPROVE_RECEIPT') {
      const { transactionId, creditType = 'MINUTES', minutesToGrant, adminNote } = body;
      if (!transactionId) {
        return NextResponse.json({ success: false, error: 'معرف معاملة الإيصال مطلوب' }, { status: 400 });
      }

      const minsNum = creditType === 'MINUTES' ? (Number(minutesToGrant) || 0) : 0;

      // Try atomic PostgreSQL RPC first
      try {
        const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('approve_wallet_receipt', {
          p_transaction_id: transactionId,
          p_credit_type: creditType,
          p_minutes: minsNum,
          p_admin_id: admin.id,
          p_admin_note: adminNote || null,
        });

        if (!rpcErr && rpcRes && rpcRes.success) {
          const profileId = rpcRes.profile_id;
          const grantedMinutes = rpcRes.minutes_credited || 0;
          const creditedAmount = rpcRes.amount_credited || rpcRes.amount || 0;
          const cur = rpcRes.currency || 'د.أ';

          const notifMsg = creditType === 'MINUTES'
            ? `تمت الموافقة على إيصالك وتغذية حسابك بـ ${grantedMinutes} دقيقة.`
            : `تمت الموافقة على إيصالك وإيداع ${creditedAmount} ${cur} في رصيد محفظتك النقدي.`;

          await sendCaptainNotification(
            profileId,
            `notif_rcpt_app_${transactionId}`,
            'تم اعتماد إيصال الشحن بنجاح ⚡',
            notifMsg,
            'WALLET_CREDIT'
          );

          return NextResponse.json({
            success: true,
            message: creditType === 'MINUTES'
              ? `تم اعتماد الإيصال بنجاح وتخصيص ${grantedMinutes} دقيقة رادار للكابتن المعلن.`
              : `تم اعتماد الإيصال وإيداع ${creditedAmount} ${cur} في رصيد الكابتن المعلن.`,
          });
        }
      } catch (rpcCatch) {
        console.warn('[Admin Notifications API] approve_wallet_receipt RPC warning, falling back to direct update:', rpcCatch);
      }

      // Fallback: Fetch transaction
      const { data: tx, error: txErr } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();

      if (txErr || !tx) {
        return NextResponse.json({ success: false, error: 'معاملة الإيصال غير موجودة' }, { status: 404 });
      }

      if (tx.status !== 'PENDING') {
        return NextResponse.json({ success: false, error: 'تمت معالجة هذا الإيصال مسبقاً.' }, { status: 400 });
      }

      const captainId = tx.profile_id;
      const amount = Number(tx.amount || 0);

      // Resolve captain's currency
      const { data: capProfile } = await supabaseAdmin
        .from('profiles')
        .select('country_id, phone')
        .eq('id', captainId)
        .maybeSingle();

      const isEgypt = capProfile?.country_id === 2 || String(capProfile?.phone || '').startsWith('+20');
      const captainCurrency = tx.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');
      const captainCurrencyCode = tx.currency_code || (isEgypt ? 'EGP' : 'JOD');

      // Fetch or initialize wallet
      const { data: existingWallet } = await supabaseAdmin
        .from('wallet_accounts')
        .select('*')
        .eq('profile_id', captainId)
        .maybeSingle();

      if (creditType === 'MINUTES') {
        const grantedMins = Number(minutesToGrant) > 0 ? Number(minutesToGrant) : Math.round(amount * 60);
        const currentMins = Number(existingWallet?.paid_minutes_remaining || 0);
        const newMins = currentMins + grantedMins;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await supabaseAdmin.from('wallet_accounts').upsert({
          profile_id: captainId,
          paid_minutes_remaining: newMins,
          currency_code: captainCurrencyCode,
          time_bundle_expires_at: expiryDate.toISOString(),
          active_package_name: `شحن إيصال (${grantedMins} دقيقة)`,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id' });

        const { error: updateTxErr } = await supabaseAdmin.from('wallet_transactions').update({
          status: 'COMPLETED',
          currency_ar: captainCurrency,
          currency_code: captainCurrencyCode,
          description_ar: `تمت الموافقة على الإيصال وتخصيص ${grantedMins} دقيقة رادار.`,
          metadata: {
            ...(tx.metadata || {}),
            approved_by: admin.id,
            approved_at: new Date().toISOString(),
            credit_type: 'MINUTES',
            minutes_credited: grantedMins,
            currency: captainCurrency,
            admin_note: adminNote || null,
          },
          updated_at: new Date().toISOString(),
        }).eq('id', transactionId);

        if (updateTxErr) {
          console.error('[Admin Notifications API] Failed to update transaction status:', updateTxErr);
          return NextResponse.json({
            success: false,
            error: `فشل تحديث حالة الإيصال في قاعدة البيانات: ${updateTxErr.message}. يرجى تطبيق كود الـ SQL في Supabase أولاً.`,
          }, { status: 400 });
        }

        await sendCaptainNotification(
          captainId,
          `notif_rcpt_app_${transactionId}`,
          'تم اعتماد إيصال الشحن بنجاح ⚡',
          `تمت الموافقة على إيصالك وتغذية حسابك بـ ${grantedMins} دقيقة.`,
          'WALLET_CREDIT'
        );

        return NextResponse.json({
          success: true,
          message: `تم اعتماد الإيصال بنجاح وتخصيص ${grantedMins} دقيقة رادار للكابتن المعلن.`,
        });
      } else {
        // Credit as CASH
        const currentBalance = Number(existingWallet?.balance || 0);
        const newBalance = Number((currentBalance + amount).toFixed(2));

        await supabaseAdmin.from('wallet_accounts').upsert({
          profile_id: captainId,
          balance: newBalance,
          currency_code: captainCurrencyCode,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id' });

        const { error: updateTxErr } = await supabaseAdmin.from('wallet_transactions').update({
          status: 'COMPLETED',
          currency_ar: captainCurrency,
          currency_code: captainCurrencyCode,
          description_ar: `تمت الموافقة على الإيصال وإيداع ${amount.toFixed(2)} ${captainCurrency} في الرصيد النقدي.`,
          metadata: {
            ...(tx.metadata || {}),
            approved_by: admin.id,
            approved_at: new Date().toISOString(),
            credit_type: 'CASH',
            amount_credited: amount,
            currency: captainCurrency,
            admin_note: adminNote || null,
          },
          updated_at: new Date().toISOString(),
        }).eq('id', transactionId);

        if (updateTxErr) {
          console.error('[Admin Notifications API] Failed to update transaction status:', updateTxErr);
          return NextResponse.json({
            success: false,
            error: `فشل تحديث حالة الإيصال في قاعدة البيانات: ${updateTxErr.message}. يرجى تطبيق كود الـ SQL في Supabase أولاً.`,
          }, { status: 400 });
        }

        await sendCaptainNotification(
          captainId,
          `notif_rcpt_app_${transactionId}`,
          'تم اعتماد إيصال الشحن بنجاح ⚡',
          `تمت الموافقة على إيصالك وإيداع ${amount.toFixed(2)} ${captainCurrency} في رصيد محفظتك النقدي.`,
          'WALLET_CREDIT'
        );

        return NextResponse.json({
          success: true,
          message: `تم اعتماد الإيصال وإيداع ${amount.toFixed(2)} ${captainCurrency} في رصيد الكابتن المعلن.`,
        });
      }
    }

    // 2. REJECT RECEIPT directly from notification center
    if (action === 'REJECT_RECEIPT') {
      const { transactionId, rejectionReason } = body;
      if (!transactionId) {
        return NextResponse.json({ success: false, error: 'معرف معاملة الإيصال مطلوب' }, { status: 400 });
      }

      const reason = rejectionReason || 'الإيصال غير واضح أو المبلغ لا يطابق عملية التحويل.';

      // Try atomic PostgreSQL RPC first
      try {
        const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('reject_wallet_receipt', {
          p_transaction_id: transactionId,
          p_reason: reason,
          p_admin_id: admin.id,
        });

        if (!rpcErr && rpcRes && rpcRes.success) {
          const profileId = rpcRes.profile_id;
          await sendCaptainNotification(
            profileId,
            `notif_rcpt_rej_${transactionId}`,
            'تعذر اعتماد إيصال الشحن ⚠️',
            `تم رفض إيصال الشحن للسبب التالي: ${reason}. يمكنك إعادة إرسال إيصال صحيح.`,
            'WALLET_ALERT'
          );

          return NextResponse.json({
            success: true,
            message: 'تم رفض الإيصال وإشعار الكابتن المعلن بسبب الرفض.',
          });
        }
      } catch (rpcCatch) {
        console.warn('[Admin Notifications API] reject_wallet_receipt RPC warning, falling back to direct update:', rpcCatch);
      }

      const { data: tx, error: txErr } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();

      if (txErr || !tx) {
        return NextResponse.json({ success: false, error: 'معاملة الإيصال غير موجودة' }, { status: 404 });
      }

      if (tx.status !== 'PENDING') {
        return NextResponse.json({ success: false, error: 'تمت معالجة هذا الإيصال مسبقاً.' }, { status: 400 });
      }

      const { error: updateTxErr } = await supabaseAdmin.from('wallet_transactions').update({
        status: 'REJECTED',
        description_ar: `تم رفض الإيصال: ${reason}`,
        metadata: {
          ...(tx.metadata || {}),
          rejected_by: admin.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        },
        updated_at: new Date().toISOString(),
      }).eq('id', transactionId);

      if (updateTxErr) {
        console.error('[Admin Notifications API] Failed to reject receipt in database:', updateTxErr);
        return NextResponse.json({
          success: false,
          error: `فشل رفض الإيصال في قاعدة البيانات: ${updateTxErr.message}. يرجى تطبيق كود الـ SQL في Supabase أولاً.`,
        }, { status: 400 });
      }

      await sendCaptainNotification(
        tx.profile_id,
        `notif_rcpt_rej_${transactionId}`,
        'تعذر اعتماد إيصال الشحن ⚠️',
        `تم رفض إيصال الشحن للسبب التالي: ${reason}. يمكنك إعادة إرسال إيصال صحيح.`,
        'WALLET_ALERT'
      );

      return NextResponse.json({
        success: true,
        message: 'تم رفض الإيصال وإشعار الكابتن المعلن بسبب الرفض.',
      });
    }

    // 3. MARK ALL SYSTEM NOTIFICATIONS AS READ
    if (action === 'MARK_ALL_READ') {
      await supabaseAdmin
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', admin.id)
        .eq('is_read', false);

      return NextResponse.json({ success: true, message: 'تم تعليم جميع الإشعارات كمقروءة.' });
    }

    return NextResponse.json({ success: false, error: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Notifications POST Error]:', error);
    return NextResponse.json({ success: false, error: error?.message || 'فشلت معالجة الإشعار' }, { status: 500 });
  }
}

