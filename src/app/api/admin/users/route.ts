import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller } from '@/lib/admin-auth-verifier';
import { encodeNotificationPayload } from '@/shared/utils/notification-i18n';

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

    // 3.5. Fetch completed trips count and active requests in batch
    let completedTripsMap = new Map<string, number>();
    let activeRequestsMap = new Map<string, string>();
    let consecutiveCancellationsMap = new Map<string, number>();

    if (profileIds.length > 0) {
      if (roleFilter === 'RIDER') {
        const [completedRes, activeRes, recentReqsRes] = await Promise.all([
          supabaseAdmin
            .from('ride_requests')
            .select('rider_id')
            .in('rider_id', profileIds)
            .eq('status', 'COMPLETED'),
          supabaseAdmin
            .from('ride_requests')
            .select('rider_id, status')
            .in('rider_id', profileIds)
            .in('status', ['PENDING', 'ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE', 'STARTED']),
          supabaseAdmin
            .from('ride_requests')
            .select('rider_id, status, created_at')
            .in('rider_id', profileIds)
            .order('created_at', { ascending: false })
            .limit(500),
        ]);

        for (const row of completedRes.data || []) {
          if (row.rider_id) {
            completedTripsMap.set(row.rider_id, (completedTripsMap.get(row.rider_id) || 0) + 1);
          }
        }
        for (const row of activeRes.data || []) {
          if (row.rider_id) {
            activeRequestsMap.set(row.rider_id, row.status);
          }
        }

        // Group recent requests chronologically by rider
        const riderRecentReqs = new Map<string, Array<{ status: string; created_at: string }>>();
        for (const req of recentReqsRes.data || []) {
          if (!req.rider_id) continue;
          if (!riderRecentReqs.has(req.rider_id)) {
            riderRecentReqs.set(req.rider_id, []);
          }
          riderRecentReqs.get(req.rider_id)!.push(req);
        }

        // Count consecutive cancellations from latest backwards until first completed trip or reset marker
        for (const [rId, reqs] of riderRecentReqs.entries()) {
          const profileRow = profiles.find(p => p.id === rId);
          let lastResetTime = 0;
          if (Array.isArray(profileRow?.rank_audit_log)) {
            for (const log of profileRow.rank_audit_log) {
              if (typeof log === 'string' && log.startsWith('RESET_PENALTIES_')) {
                const ts = parseInt(log.replace('RESET_PENALTIES_', ''), 10);
                if (ts > lastResetTime) lastResetTime = ts;
              }
            }
          }

          let cancellations = 0;
          for (const req of reqs) {
            if (lastResetTime > 0 && new Date(req.created_at).getTime() <= lastResetTime) {
              break;
            }
            if (req.status === 'CANCELLED') {
              cancellations++;
            } else if (req.status === 'COMPLETED') {
              break;
            }
          }
          consecutiveCancellationsMap.set(rId, cancellations);
        }
      } else {
        const [capCompleted, capActive] = await Promise.all([
          supabaseAdmin
            .from('ride_requests')
            .select('accepted_captain_id')
            .in('accepted_captain_id', profileIds)
            .eq('status', 'COMPLETED'),
          supabaseAdmin
            .from('ride_requests')
            .select('accepted_captain_id, status')
            .in('accepted_captain_id', profileIds)
            .in('status', ['ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE', 'STARTED']),
        ]);

        for (const row of capCompleted.data || []) {
          if (row.accepted_captain_id) {
            completedTripsMap.set(row.accepted_captain_id, (completedTripsMap.get(row.accepted_captain_id) || 0) + 1);
          }
        }
        for (const row of capActive.data || []) {
          if (row.accepted_captain_id) {
            activeRequestsMap.set(row.accepted_captain_id, row.status);
          }
        }
      }
    }

    // 4. Fetch governorate, district, and countries lookup tables
    const [govRes, distRes, countriesRes] = await Promise.all([
      supabaseAdmin.from('governorates').select('id, name_ar, country_id').order('id', { ascending: true }),
      supabaseAdmin.from('districts').select('id, name_ar, governorate_id').order('id', { ascending: true }),
      supabaseAdmin.from('countries').select('id, currency_ar, currency_en, name_ar, country_code').order('id', { ascending: true }),
    ]);

    const govMap = new Map((govRes.data || []).map(g => [g.id, g.name_ar]));
    const distMap = new Map((distRes.data || []).map(d => [d.id, d.name_ar]));
    const countriesMap = new Map((countriesRes.data || []).map(c => [c.id, c]));

    // Combine data
    const users = profiles.map(p => {
      const w = walletMap.get(p.id) || {};
      const cap = captainProfilesMap.get(p.id) || {};

      const govName = p.governorate_id ? govMap.get(p.governorate_id) : p.governorate;
      const distName = p.district_id ? distMap.get(p.district_id) : p.district;
      const country = p.country_id ? countriesMap.get(p.country_id) : null;
      const isEgypt = p.country_id === 2 || String(p.phone || '').startsWith('+20');
      const currencyAr = country?.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');
      const currencyCode = country?.currency_en || w.currency_code || (isEgypt ? 'EGP' : 'JOD');

      let userStatus = (p.status || 'IDLE').toUpperCase();
      if (userStatus === 'BANNED' && Array.isArray(p.rank_audit_log) && p.rank_audit_log.includes('ACCOUNT_SUSPENDED')) {
        userStatus = 'SUSPENDED';
      }

      // Elevate operational status if user has active/ongoing ride request
      if (userStatus !== 'BANNED' && userStatus !== 'SUSPENDED') {
        const activeReq = activeRequestsMap.get(p.id);
        if (activeReq === 'PENDING') {
          userStatus = 'ACTIVE';
        } else if (activeReq && ['ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE', 'STARTED'].includes(activeReq)) {
          userStatus = 'BUSY';
        }
      }

      return {
        id: p.id,
        serial_id: p.serial_id || (p.role === 'CAPTAIN' ? `C-${p.id.slice(0, 4)}` : `R-${p.id.slice(0, 4)}`),
        full_name: p.full_name || 'مستخدم غير مسمّى',
        phone: p.phone || '',
        email: p.email || '',
        role: p.role,
        country_id: p.country_id,
        country_name: country?.name_ar || (isEgypt ? 'مصر' : 'الأردن'),
        currency: currencyAr,
        currency_ar: currencyAr,
        currency_code: currencyCode,
        status: userStatus,
        completed_trips_count: Number(completedTripsMap.get(p.id) || 0),
        tier: (p.tier || 'SILVER').toUpperCase(),
        rating: Number(p.rating ?? 5.0),
        rating_count: Number(p.rating_count ?? 0),
        heart_count: Number(p.heart_count ?? 0),
        penalty_count: Number(p.penalty_count ?? 0),
        trust_score: Number(p.trust_score ?? p.trust_rating ?? 5.0),
        consecutive_cancellations: consecutiveCancellationsMap.has(p.id)
          ? (consecutiveCancellationsMap.get(p.id) || 0)
          : Number(p.consecutive_cancellations ?? 0),
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
          currency_code: currencyCode,
          currency_ar: currencyAr,
        },
      };
    });

    return NextResponse.json({
      success: true,
      users,
      geo: {
        countries: (countriesRes.data || []).map(c => ({ id: c.id, name_ar: c.name_ar, country_code: c.country_code })),
        governorates: (govRes.data || []).map(g => ({ id: g.id, name_ar: g.name_ar, country_id: g.country_id })),
        districts: (distRes.data || []).map(d => ({ id: d.id, name_ar: d.name_ar, governorate_id: d.governorate_id })),
      },
    });
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
    const { action, userId, userIds, target, role = 'CAPTAIN' } = body || {};

    const isBulkAction = action?.startsWith('bulk_');

    if (!isBulkAction && !userId) {
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

        // Map operational/security status to database user_status enum ('ACTIVE', 'IDLE', 'BANNED').
        // 'SUSPENDED' is stored as 'BANNED' in Postgres with 'ACCOUNT_SUSPENDED' in rank_audit_log.
        const dbStatus = normalizedStatus === 'SUSPENDED' ? 'BANNED' : normalizedStatus === 'BUSY' ? 'ACTIVE' : normalizedStatus;

        // Fetch current profile
        const { data: currProfile } = await supabaseAdmin
          .from('profiles')
          .select('role, rank_audit_log')
          .eq('id', userId)
          .single();

        const originalRole = currProfile?.role || 'CAPTAIN';
        let currentLogs: string[] = Array.isArray(currProfile?.rank_audit_log) ? [...currProfile.rank_audit_log] : [];

        if (normalizedStatus === 'SUSPENDED') {
          if (!currentLogs.includes('ACCOUNT_SUSPENDED')) {
            currentLogs.push('ACCOUNT_SUSPENDED');
          }
        } else {
          currentLogs = currentLogs.filter(l => l !== 'ACCOUNT_SUSPENDED');
        }

        if (originalRole === 'CAPTAIN' || originalRole === 'DRIVER') {
          // Bypass sync_captain_rank trigger via temporary role shift
          const { error: err1 } = await supabaseAdmin
            .from('profiles')
            .update({
              role: 'RIDER',
              status: dbStatus,
              rank_audit_log: currentLogs,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (err1) throw err1;

          const { error: err2 } = await supabaseAdmin
            .from('profiles')
            .update({
              role: originalRole,
              status: dbStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (err2) throw err2;
        } else {
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              status: dbStatus,
              rank_audit_log: currentLogs,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (error) throw error;
        }

        // Update auth metadata
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
              status: normalizedStatus,
              security_status: (normalizedStatus === 'SUSPENDED' || normalizedStatus === 'BANNED') ? normalizedStatus : null,
            },
          });
        } catch (authErr) {
          console.warn('[Admin API] update_status auth metadata update skipped:', authErr);
        }

        // Dissolve radar buoy and cancel any pending ride requests if suspended or banned
        if (normalizedStatus === 'SUSPENDED' || normalizedStatus === 'BANNED') {
          await supabaseAdmin
            .from('ride_requests')
            .update({
              status: 'CANCELLED',
              cancelled_at: new Date().toISOString(),
            })
            .eq('rider_id', userId)
            .eq('status', 'PENDING');
        }

        // Push real-time notification to the user
        let notifTitle = 'تحديث في الحالة التشغيلية';
        let notifDesc = `قامت الإدارة بتحديث حالتك إلى: ${normalizedStatus}`;
        let notifType: 'admin_message' | 'warning' | 'urgent' = 'admin_message';

        const isRider = originalRole === 'RIDER';

        if (normalizedStatus === 'ACTIVE') {
          notifTitle = isRider ? 'تم تنشيط حسابك على الرادار ⚡' : 'تم تنشيط حسابك على الرادار ⚡';
          notifDesc = isRider
            ? 'قامت إدارة المنظومة بتنشيط حسابك فورياً، وأصبحت جاهزاً لطلب الرحلات والتواصل مع الكباتن المعلنين عبر الرادار.'
            : 'قامت إدارة المنظومة بتنشيط حسابك فورياً، وأصبحت متصلاً بالرادار وجاهزاً لاستقبال طلبات المستخدمين.';
        } else if (normalizedStatus === 'IDLE') {
          notifTitle = isRider ? 'تم ضبط حسابك إلى وضع الجاهزية 🛑' : 'تم ضبط وضعك إلى خامل (جاهز) 🛑';
          notifDesc = isRider
            ? 'أنت الآن في وضع الجاهزية، يمكنك طلب الرحلات عبر الرادار في أي وقت.'
            : 'أنت الآن في وضع الجاهزية والخمول، يمكنك تفعيل الاتصال بالرادار متى شئت.';
        } else if (normalizedStatus === 'SUSPENDED') {
          notifTitle = isRider ? 'تنبيه إداري: تم تعليق حساب المستخدم مؤقتاً ⚠️' : 'تنبيه إداري: تم تعليق حسابك مؤقتاً ⚠️';
          notifDesc = 'تم تعليق حسابك مؤقتاً من قبل إدارة العمليات لمراجعة النشاط أو المناعة السلوكية. يرجى مراجعة الإدارة أو التواصل مع الدعم لفك التعليق.';
          notifType = 'warning';
        } else if (normalizedStatus === 'BANNED') {
          notifTitle = isRider ? 'إشعار أمني: تم حظر حساب المستخدم نهائياً 🚫' : 'إشعار أمني: تم حظر حسابك نهائياً 🚫';
          notifDesc = isRider
            ? 'تم حظر حسابك نهائياً من قبل إدارة المنظومة لمخالفة المعايير التشغيلية والسيادية. تم إيقاف إمكانية طلب الرحلات والاتصال بالرادار.'
            : 'تم حظر حسابك نهائياً من قبل إدارة المنظومة لمخالفة المعايير التشغيلية والسيادية.';
          notifType = 'urgent';
        }

        await supabaseAdmin.from('user_notifications').insert({
          id: `notif_status_${userId}_${Date.now()}`,
          user_id: userId,
          title: notifTitle,
          description: notifDesc,
          type: notifType,
          is_read: false,
          created_at: new Date().toISOString(),
        });

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

        // Push notification to captain
        if (normStatus === 'APPROVED') {
          await supabaseAdmin.from('user_notifications').insert({
            id: `notif_verif_${userId}_${Date.now()}`,
            user_id: userId,
            title: 'تهانينا يا كابتن معلن! تم اعتماد وتوثيق حسابك رسمياً 🏆',
            description: 'تمت مراجعة وتدقيق هويتك ومستنداتك بنجاح من قبل إدارة المنظومة، ومُنحت شارة «كابتن معلن موثق رسمياً ✓».',
            type: 'admin_message',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        } else if (normStatus === 'REJECTED') {
          await supabaseAdmin.from('user_notifications').insert({
            id: `notif_verif_rej_${userId}_${Date.now()}`,
            user_id: userId,
            title: 'تنبيه: مراجعة وثائق الكابتن المعلن ⚠️',
            description: reason || 'يرجى إعادة رفع وثائق واضحة ومطابقة للشروط والتعليمات لتأكيد اعتماد الحساب.',
            type: 'warning',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }

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

        // Push real-time notification to the captain
        await supabaseAdmin.from('user_notifications').insert({
          id: `notif_topup_min_${userId}_${Date.now()}`,
          user_id: userId,
          title: 'شحن رصيد دقائق الرادار ⚡',
          description: `تم شحن (${minutes}) دقيقة طيران رادار لحسابك بنجاح من قبل الإدارة. أصبحت الدقائق جاهزة للاستخدام الآن!`,
          type: 'admin_message',
          is_read: false,
          created_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `تم شحن ${minutes} دقيقة رادار بنجاح وتمديد الصلاحية لـ ${extendDays} يوماً.`,
        });
      }

      // 4. Adjust cash balance (JD / EGP)
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

        // Push real-time notification to the captain
        await supabaseAdmin.from('user_notifications').insert({
          id: `notif_adjust_bal_${userId}_${Date.now()}`,
          user_id: userId,
          title: 'إيداع نقدي في المحفظة 💰',
          description: `تم إيداع مبلغ (${amount}) في محفظتك بنجاح من قبل الإدارة. الرصيد المالي الحالي: ${newBalance.toFixed(2)}.`,
          type: 'admin_message',
          is_read: false,
          created_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `تم تعديل الرصيد بمقدار ${amount > 0 ? '+' : ''}${amount}. الرصيد الحالي: ${newBalance.toFixed(2)}`,
        });
      }

      // 5. Reset penalties and behavioral immunity
      case 'reset_penalties': {
        const { data: currProfile } = await supabaseAdmin
          .from('profiles')
          .select('role, rank_audit_log')
          .eq('id', userId)
          .single();

        const originalRole = currProfile?.role || 'CAPTAIN';
        let currentLogs: string[] = Array.isArray(currProfile?.rank_audit_log) ? [...currProfile.rank_audit_log] : [];
        currentLogs = currentLogs.filter(l => l !== 'ACCOUNT_SUSPENDED');
        currentLogs.push(`RESET_PENALTIES_${Date.now()}`);

        const updatePayload: Record<string, any> = {
          penalty_count: 0,
          rating: 5.0,
          trust_score: 5.0,
          trust_rating: 5.0,
          behavior_rating: 5.0,
          rank_penalty_expires_at: null,
          rank_audit_log: currentLogs,
          status: 'IDLE',
          updated_at: new Date().toISOString(),
        };

        if (originalRole === 'CAPTAIN' || originalRole === 'DRIVER') {
          // Temporarily shift role to RIDER to bypass sync_captain_rank trigger which discards direct writes
          const { error: err1 } = await supabaseAdmin
            .from('profiles')
            .update({
              role: 'RIDER',
              ...updatePayload,
            })
            .eq('id', userId);

          if (err1) throw err1;

          // Restore original captain role
          const { error: err2 } = await supabaseAdmin
            .from('profiles')
            .update({
              role: originalRole,
              status: 'IDLE',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (err2) throw err2;
        } else {
          // Direct update for RIDER or other roles
          const { error } = await supabaseAdmin
            .from('profiles')
            .update(updatePayload)
            .eq('id', userId);

          if (error) throw error;
        }

        // Update auth metadata to clear suspended status
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
              status: 'IDLE',
              security_status: null,
            },
          });
        } catch (authErr) {
          console.warn('[Admin API] reset_penalties auth metadata update skipped:', authErr);
        }

        // Push real-time notification to the user
        await supabaseAdmin.from('user_notifications').insert({
          id: `notif_reset_penalties_${userId}_${Date.now()}`,
          user_id: userId,
          title: originalRole === 'CAPTAIN' || originalRole === 'DRIVER'
            ? 'سجل المخالفات وكوابح السوق 🛡️'
            : 'إعادة تأهيل الحساب والنزاهة السلوكية 🛡️',
          description: originalRole === 'CAPTAIN' || originalRole === 'DRIVER'
            ? 'تمت مراجعة حسابك وتصفير سجل المخالفات بالكامل، واستعادة مؤشر الأمان والنزاهة السلوكية إلى 5.0 نجوم بنجاح.'
            : 'تمت إعادة تأهيل حسابك واستعادة مؤشر النزاهة والمناعة السلوكية إلى 5.0 نجوم كاملة وتصفير أي عقوبات سابقة بنجاح.',
          type: 'admin_message',
          is_read: false,
          created_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: 'تم تصفير عداد المخالفات واستعادة مؤشر النزاهة السلوكية إلى 5.0 نجوم بنجاح.',
        });
      }

      // 6. Update captain tier (Rank)
      case 'update_tier': {
        const tier = String(body.tier).toUpperCase();
        if (!['PLATINUM', 'GOLD', 'BRONZE', 'SILVER'].includes(tier)) {
          return NextResponse.json({ success: false, error: 'الرتبة غير صحيحة' }, { status: 400 });
        }

        // Fetch current profile role
        const { data: currProfile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        const originalRole = currProfile?.role || 'CAPTAIN';

        // Step 1: Temporarily shift role to RIDER to bypass sync_captain_rank trigger which discards direct writes to tier
        const { error: err1 } = await supabaseAdmin
          .from('profiles')
          .update({
            role: 'RIDER',
            tier,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (err1) throw err1;

        // Step 2: Restore original captain role (the trigger keeps OLD.tier which is now the updated tier)
        const { error: err2 } = await supabaseAdmin
          .from('profiles')
          .update({
            role: originalRole,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (err2) throw err2;

        // Also update Supabase auth metadata to mirror rank
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { tier, rank: tier },
          });
        } catch (authErr) {
          console.warn('[Admin API] update_tier auth metadata update skipped:', authErr);
        }

        const tierNames: Record<string, string> = {
          PLATINUM: 'البلاتينية 💎',
          GOLD: 'الذهبية 🥇',
          BRONZE: 'البرونزية 🥉',
          SILVER: 'الفضية 🥈',
        };

        // Push real-time notification to the captain
        await supabaseAdmin.from('user_notifications').insert({
          id: `notif_tier_${userId}_${Date.now()}`,
          user_id: userId,
          title: `ترقية سيادية: أصبحت رتبتك ${tierNames[tier] || tier} 🏆`,
          description: `تهانينا يا كابتن معلن! قامت الإدارة بترقية رتبتك إلى (${tierNames[tier] || tier})، مما يمنحك مميزات تسعير وعروض أفضل على الرادار.`,
          type: 'admin_message',
          is_read: false,
          created_at: new Date().toISOString(),
        });

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

        // Also release and cancel any stuck active trip in ride_requests for this captain
        await supabaseAdmin
          .from('ride_requests')
          .update({
            status: 'CANCELLED',
            updated_at: new Date().toISOString(),
          })
          .eq('captain_id', userId)
          .in('status', ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'PICKED_UP', 'STARTED']);

        // Push real-time notification to the captain
        await supabaseAdmin.from('user_notifications').insert({
          id: `notif_clear_trip_${userId}_${Date.now()}`,
          user_id: userId,
          title: 'فك تعليق الرحلة ⚡',
          description: 'تم فك تعليق رحلتك من قبل الإدارة وإعادتك لوضع الجاهزية (IDLE) لاستقبال طلبات جديدة.',
          type: 'admin_message',
          is_read: false,
          created_at: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, message: 'تم فك تعليق الرحلة وإعادة الكابتن المعلن لوضع الجاهزية (IDLE).' });
      }

      // 8. Send direct real-time message/notification to user or captain
      case 'send_message': {
        const { title, message, type, titleEn, messageEn, title_en, message_en } = body;
        if (!message || !String(message).trim()) {
          return NextResponse.json({ success: false, error: 'نص الرسالة مطلوب' }, { status: 400 });
        }

        const msgTitle = title && String(title).trim() ? String(title).trim() : 'رسالة من إدارة المنظومة';
        const msgType = type || 'admin_message';
        const enTitle = (titleEn || title_en || '').trim();
        const enMessage = (messageEn || message_en || '').trim();

        const encodedPayload = encodeNotificationPayload(msgTitle, String(message).trim(), enTitle, enMessage);

        const { data: notif, error: notifErr } = await supabaseAdmin
          .from('user_notifications')
          .insert({
            user_id: userId,
            title: encodedPayload.title,
            description: encodedPayload.description,
            type: msgType,
            is_read: false,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (notifErr) throw notifErr;

        return NextResponse.json({
          success: true,
          message: 'تم إرسال الرسالة بنجاح عبر الإشعار اللحظي.',
          notification: notif,
        });
      }

      // 9. Bulk send real-time notification to all or selected captains
      case 'bulk_send_message': {
        const { title, message, type, titleEn, messageEn, title_en, message_en } = body;
        if (!message || !String(message).trim()) {
          return NextResponse.json({ success: false, error: 'نص الرسالة مطلوب' }, { status: 400 });
        }

        const msgTitle = title && String(title).trim() ? String(title).trim() : 'رسالة من إدارة المنظومة';
        const msgType = type || 'admin_message';
        const enTitle = (titleEn || title_en || '').trim();
        const enMessage = (messageEn || message_en || '').trim();

        const encodedPayload = encodeNotificationPayload(msgTitle, String(message).trim(), enTitle, enMessage);

        let targetIds: string[] = [];

        if (Array.isArray(userIds) && userIds.length > 0) {
          targetIds = userIds;
        } else {
          const { data: captainsData, error: capErr } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', role);

          if (capErr) throw capErr;
          targetIds = (captainsData || []).map(c => c.id);
        }

        if (targetIds.length === 0) {
          return NextResponse.json({ success: false, error: 'لم يتم العثور على أي مستخدمين لإرسال الإشعار إليهم' }, { status: 400 });
        }

        const notifications = targetIds.map(id => ({
          user_id: id,
          title: encodedPayload.title,
          description: encodedPayload.description,
          type: msgType,
          is_read: false,
          created_at: new Date().toISOString(),
        }));

        const CHUNK_SIZE = 500;
        for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
          const chunk = notifications.slice(i, i + CHUNK_SIZE);
          const { error: insertErr } = await supabaseAdmin
            .from('user_notifications')
            .insert(chunk);
          if (insertErr) throw insertErr;
        }

        return NextResponse.json({
          success: true,
          count: targetIds.length,
          message: `تم إرسال الإشعار اللحظي بنجاح إلى (${targetIds.length}) مستخدم.`,
        });
      }

      // 10. Bulk top-up minutes or cash balance to all or selected captains
      case 'bulk_topup': {
        const { topupType = 'minutes', minutes, extendDays = 30, amount } = body;

        let targetIds: string[] = [];

        if (Array.isArray(userIds) && userIds.length > 0) {
          targetIds = userIds;
        } else {
          const { data: captainsData, error: capErr } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', role);

          if (capErr) throw capErr;
          targetIds = (captainsData || []).map(c => c.id);
        }

        if (targetIds.length === 0) {
          return NextResponse.json({ success: false, error: 'لم يتم العثور على كباتن لتنفيذ الشحن' }, { status: 400 });
        }

        const CHUNK_SIZE = 500;

        if (topupType === 'minutes') {
          const numMinutes = Number(minutes);
          if (isNaN(numMinutes) || numMinutes <= 0) {
            return NextResponse.json({ success: false, error: 'عدد الدقائق غير صحيح' }, { status: 400 });
          }

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + Number(extendDays || 30));

          const { data: existingWallets, error: wErr } = await supabaseAdmin
            .from('wallet_accounts')
            .select('profile_id, paid_minutes_remaining, balance')
            .in('profile_id', targetIds);

          if (wErr) throw wErr;

          const walletMap = new Map((existingWallets || []).map(w => [w.profile_id, w]));

          const upsertRows = targetIds.map(id => {
            const current = walletMap.get(id);
            const currentMinutes = Number(current?.paid_minutes_remaining || 0);
            return {
              profile_id: id,
              balance: Number(current?.balance || 0),
              paid_minutes_remaining: currentMinutes + numMinutes,
              time_bundle_expires_at: expiresAt.toISOString(),
              active_package_name: `شحن جماعي (${numMinutes} دقيقة)`,
              updated_at: new Date().toISOString(),
            };
          });

          for (let i = 0; i < upsertRows.length; i += CHUNK_SIZE) {
            const chunk = upsertRows.slice(i, i + CHUNK_SIZE);
            const { error: upErr } = await supabaseAdmin
              .from('wallet_accounts')
              .upsert(chunk, { onConflict: 'profile_id' });
            if (upErr) throw upErr;
          }

          const notifs = targetIds.map(id => ({
            user_id: id,
            title: '⚡ شحن دقائق رادار جماعي',
            description: `تمت إضافة (${numMinutes}) دقيقة رادار لحسابك بنجاح من قبل إدارة المنظومة وتمديد الصلاحية لـ ${extendDays} يوماً.`,
            type: 'deposit_confirmed',
            is_read: false,
            created_at: new Date().toISOString(),
          }));

          for (let i = 0; i < notifs.length; i += CHUNK_SIZE) {
            const chunk = notifs.slice(i, i + CHUNK_SIZE);
            await supabaseAdmin.from('user_notifications').insert(chunk);
          }

          return NextResponse.json({
            success: true,
            count: targetIds.length,
            message: `تم شحن ${numMinutes} دقيقة رادار لـ (${targetIds.length}) كابتن معلن بنجاح وإرسال إشعار لحظي لكل منهم.`,
          });
        } else {
          const numAmount = Number(amount);
          if (isNaN(numAmount) || numAmount === 0) {
            return NextResponse.json({ success: false, error: 'المبلغ غير صحيح' }, { status: 400 });
          }

          const { data: existingWallets, error: wErr } = await supabaseAdmin
            .from('wallet_accounts')
            .select('profile_id, balance')
            .in('profile_id', targetIds);

          if (wErr) throw wErr;

          const walletMap = new Map((existingWallets || []).map(w => [w.profile_id, w]));

          const upsertRows = targetIds.map(id => {
            const current = walletMap.get(id);
            const currentBal = Number(current?.balance || 0);
            return {
              profile_id: id,
              balance: Math.max(0, currentBal + numAmount),
              updated_at: new Date().toISOString(),
            };
          });

          for (let i = 0; i < upsertRows.length; i += CHUNK_SIZE) {
            const chunk = upsertRows.slice(i, i + CHUNK_SIZE);
            const { error: upErr } = await supabaseAdmin
              .from('wallet_accounts')
              .upsert(chunk, { onConflict: 'profile_id' });
            if (upErr) throw upErr;
          }

          const notifs = targetIds.map(id => ({
            user_id: id,
            title: '💰 إيداع رصيد نقدي',
            description: `تم إيداع مبلغ (${numAmount > 0 ? '+' : ''}${numAmount}) في محفظتك من قبل إدارة المنظومة.`,
            type: 'deposit_confirmed',
            is_read: false,
            created_at: new Date().toISOString(),
          }));

          for (let i = 0; i < notifs.length; i += CHUNK_SIZE) {
            const chunk = notifs.slice(i, i + CHUNK_SIZE);
            await supabaseAdmin.from('user_notifications').insert(chunk);
          }

          return NextResponse.json({
            success: true,
            count: targetIds.length,
            message: `تم تعديل الرصيد النقدي بمقدار (${numAmount}) لـ (${targetIds.length}) كابتن معلن بنجاح.`,
          });
        }
      }

      default:
        return NextResponse.json({ success: false, error: `إجراء غير معروف: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Users API] Mutation error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
  }
}

