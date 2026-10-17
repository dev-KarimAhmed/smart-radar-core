import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller } from '@/lib/admin-auth-verifier';

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get('role')?.toUpperCase() || 'CAPTAIN';

  try {
    const targetRole = roleFilter === 'CAPTAIN' ? 'CAPTAIN' : 'RIDER';

    // 1. Fetch profiles
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', targetRole)
      .order('created_at', { ascending: false });

    if (pErr) throw pErr;
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    const profileIds = profiles.map(p => p.id);

    // 2. Fetch wallets for all users in one batch
    const { data: wallets } = await supabaseAdmin
      .from('wallet_accounts')
      .select('*')
      .in('profile_id', profileIds);

    const walletMap = new Map((wallets || []).map(w => [w.profile_id, w]));

    // 3. If captain, fetch captain_profiles in batch
    let captainProfilesMap = new Map();
    if (roleFilter === 'CAPTAIN') {
      const { data: caps } = await supabaseAdmin
        .from('captain_profiles')
        .select('*')
        .in('id', profileIds);

      captainProfilesMap = new Map((caps || []).map(c => [c.id, c]));
    }

    // 4. Fetch governorate and district lookup tables
    const [govRes, distRes] = await Promise.all([
      supabaseAdmin.from('governorates').select('id, name_ar'),
      supabaseAdmin.from('districts').select('id, name_ar'),
    ]);

    const govMap = new Map((govRes.data || []).map(g => [g.id, g.name_ar]));
    const distMap = new Map((distRes.data || []).map(d => [d.id, d.name_ar]));

    // Combine data
    const users = profiles.map(p => {
      const w = walletMap.get(p.id) || {};
      const cap = captainProfilesMap.get(p.id) || {};

      const govName = p.governorate_id ? govMap.get(p.governorate_id) : p.governorate;
      const distName = p.district_id ? distMap.get(p.district_id) : p.district;

      return {
        id: p.id,
        serial_id: p.serial_id || (p.role === 'CAPTAIN' ? `C-${p.id.slice(0, 4)}` : `R-${p.id.slice(0, 4)}`),
        full_name: p.full_name || 'مستخدم غير مسمّى',
        phone: p.phone || '',
        email: p.email || '',
        role: p.role,
        status: (p.status || 'IDLE').toUpperCase(),
        tier: (p.tier || 'SILVER').toUpperCase(),
        rating: Number(p.rating ?? 5.0),
        rating_count: Number(p.rating_count ?? 0),
        heart_count: Number(p.heart_count ?? 0),
        penalty_count: Number(p.penalty_count ?? 0),
        trust_score: Number(p.trust_score ?? p.trust_rating ?? 5.0),
        consecutive_cancellations: Number(p.consecutive_cancellations ?? 0),
        governorate: govName || 'عمّان',
        district: distName || 'المركز',
        governorate_id: p.governorate_id,
        district_id: p.district_id,
        created_at: p.created_at,
        updated_at: p.updated_at,
        // Vehicle info (merged from captain_profiles or profiles)
        vehicle: {
          brand: cap.vehicle_brand || p.vehicle_make || '',
          model: cap.vehicle_model || '',
          year: cap.vehicle_year || (p.vehicle_year ? Number(p.vehicle_year) : 0),
          color: cap.vehicle_color || p.vehicle_color || '',
          plate: cap.plate_number || p.vehicle_plate || '',
          type: cap.vehicle_type || 'STANDARD',
          affiliation_type: cap.affiliation_type || 'independent',
          office_phone: cap.office_phone || '',
          side_id: cap.side_id || '',
        },
        verification_status: (cap.verification_status || 'PENDING').toUpperCase(),
        documents: {
          identity_url: cap.identity_url || cap.national_id_url || null,
          driving_license_url: cap.driving_license_url || null,
          vehicle_registration_url: cap.vehicle_registration_url || null,
          criminal_record_url: cap.criminal_record_url || null,
        },
        // Wallet & Minutes info
        wallet: {
          balance: Number(w.balance ?? 0),
          paid_minutes_remaining: Number(w.paid_minutes_remaining ?? 0),
          bonus_minutes_remaining: Number(w.bonus_minutes_remaining ?? 0),
          total_minutes: Number(w.paid_minutes_remaining ?? 0) + Number(w.bonus_minutes_remaining ?? 0),
          active_package_name: w.active_package_name || null,
          time_bundle_expires_at: w.time_bundle_expires_at || null,
          currency_code: w.currency_code || 'JOD',
        },
      };
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('[Admin Users API] GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch users' }, { status: 500 });
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
  } catch (err: any) {
    console.error('[Admin Users API] Error parsing JSON body:', err);
    return NextResponse.json({ success: false, error: 'تعذر قراءة بيانات الطلب (Invalid JSON body)' }, { status: 400 });
  }

  try {
    const { action, userId } = body || {};

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    switch (action) {
      // 1. Update user status: ACTIVE, IDLE, BUSY, SUSPENDED, BANNED
      case 'update_status': {
        const { status, note } = body;
        const normalizedStatus = String(status).toUpperCase();
        if (!['ACTIVE', 'IDLE', 'BUSY', 'SUSPENDED', 'BANNED'].includes(normalizedStatus)) {
          return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            status: normalizedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) throw error;
        return NextResponse.json({ success: true, message: `تم تحديث الحالة إلى ${normalizedStatus}` });
      }

      // 2. Update captain verification: APPROVED, REJECTED, PENDING
      case 'update_verification': {
        const { verificationStatus, reason } = body;
        const normStatus = String(verificationStatus).toUpperCase();
        if (!['APPROVED', 'REJECTED', 'PENDING'].includes(normStatus)) {
          return NextResponse.json({ success: false, error: 'Invalid verification status' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from('captain_profiles')
          .update({
            verification_status: normStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) throw error;
        return NextResponse.json({ success: true, message: `تم تحديث حالة الاعتماد إلى ${normStatus}` });
      }

      // 3. Top-up radar flight minutes
      case 'topup_minutes': {
        const minutes = Number(body.minutes);
        if (isNaN(minutes) || minutes <= 0) {
          return NextResponse.json({ success: false, error: 'عدد الدقائق غير صحيح' }, { status: 400 });
        }

        const extendDays = Number(body.extendDays || 30);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + extendDays);

        // Fetch current wallet
        const { data: existingWallet } = await supabaseAdmin
          .from('wallet_accounts')
          .select('*')
          .eq('profile_id', userId)
          .single();

        if (existingWallet) {
          const newMinutes = (Number(existingWallet.paid_minutes_remaining) || 0) + minutes;
          const { error } = await supabaseAdmin
            .from('wallet_accounts')
            .update({
              paid_minutes_remaining: newMinutes,
              time_bundle_expires_at: expiresAt.toISOString(),
              active_package_name: `شحن إداري (${minutes} دقيقة)`,
              updated_at: new Date().toISOString(),
            })
            .eq('profile_id', userId);

          if (error) throw error;
        } else {
          const { error } = await supabaseAdmin
            .from('wallet_accounts')
            .insert({
              profile_id: userId,
              balance: 0,
              paid_minutes_remaining: minutes,
              bonus_minutes_remaining: 0,
              time_bundle_expires_at: expiresAt.toISOString(),
              active_package_name: `شحن إداري (${minutes} دقيقة)`,
              currency_code: 'JOD',
            });

          if (error) throw error;
        }

        return NextResponse.json({
          success: true,
          message: `تم شحن ${minutes} دقيقة رادار بنجاح وتمديد الصلاحية لـ ${extendDays} يوماً.`,
        });
      }

      // 4. Adjust cash balance (JD)
      case 'adjust_balance': {
        const amount = Number(body.amount);
        if (isNaN(amount)) {
          return NextResponse.json({ success: false, error: 'المبلغ غير صحيح' }, { status: 400 });
        }

        const { data: existingWallet } = await supabaseAdmin
          .from('wallet_accounts')
          .select('balance')
          .eq('profile_id', userId)
          .single();

        const currentBalance = Number(existingWallet?.balance || 0);
        const newBalance = Math.max(0, currentBalance + amount);

        const { error } = await supabaseAdmin
          .from('wallet_accounts')
          .upsert({
            profile_id: userId,
            balance: newBalance,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'profile_id' });

        if (error) throw error;
        return NextResponse.json({
          success: true,
          message: `تم تعديل الرصيد بمقدار ${amount > 0 ? '+' : ''}${amount} د.أ. الرصيد الحالي: ${newBalance.toFixed(2)} د.أ`,
        });
      }

      // 5. Reset penalties and behavioral immunity
      case 'reset_penalties': {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            penalty_count: 0,
            rating: 5.0,
            trust_score: 5.0,
            trust_rating: 5.0,
            consecutive_cancellations: 0,
            status: 'IDLE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) throw error;
        return NextResponse.json({
          success: true,
          message: 'تم تصفير عداد المخالفات واستعادة مؤشر النزاهة السلوكية إلى 5.0 نجوم بنجاح.',
        });
      }

      // 6. Update captain tier (Rank)
      case 'update_tier': {
        const tier = String(body.tier).toUpperCase();
        if (!['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(tier)) {
          return NextResponse.json({ success: false, error: 'الرتبة غير صحيحة' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            tier,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) throw error;
        return NextResponse.json({ success: true, message: `تم تحديث الرتبة إلى ${tier}` });
      }

      // 7. Force clear stuck busy trip
      case 'force_clear_trip': {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            status: 'IDLE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) throw error;
        return NextResponse.json({ success: true, message: 'تم فك تعليق الرحلة وإعادة الكابتن لوضع الجاهزية (IDLE).' });
      }

      // 8. Send direct real-time message/notification to user or captain
      case 'send_message': {
        const { title, message, type } = body;
        if (!message || !String(message).trim()) {
          return NextResponse.json({ success: false, error: 'نص الرسالة مطلوب' }, { status: 400 });
        }

        const msgTitle = title && String(title).trim() ? String(title).trim() : 'رسالة من إدارة المنظومة';
        const msgType = type || 'admin_message';

        const { data: notif, error: notifErr } = await supabaseAdmin
          .from('user_notifications')
          .insert({
            user_id: userId,
            title: msgTitle,
            description: String(message).trim(),
            type: msgType,
            is_read: false,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (notifErr) throw notifErr;

        return NextResponse.json({
          success: true,
          message: 'تم إرسال الرسالة إلى الكابتن بنجاح عبر الإشعار اللحظي.',
          notification: notif,
        });
      }

      default:
        return NextResponse.json({ success: false, error: `إجراء غير معروف: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Users API] Mutation error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
  }
}

