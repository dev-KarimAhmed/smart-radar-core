import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function fetchAdminUsers(roleFilter: string) {
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

    const profileIds = profiles.map((p) => p.id);

    // 2. Fetch wallets for all users in one batch
    const { data: wallets } = await supabaseAdmin
      .from('wallet_accounts')
      .select('*')
      .in('profile_id', profileIds);

    const walletMap = new Map((wallets || []).map((w) => [w.profile_id, w]));

    // 3. If captain, fetch captain_profiles in batch
    let captainProfilesMap = new Map();
    if (roleFilter === 'CAPTAIN') {
      const { data: caps } = await supabaseAdmin
        .from('captain_profiles')
        .select('*')
        .in('id', profileIds);

      captainProfilesMap = new Map((caps || []).map((c) => [c.id, c]));
    }

    // 3.5. Fetch completed trips count, active requests, and referral activity in batch
    let completedTripsMap = new Map<string, number>();
    let activeRequestsMap = new Map<string, string>();
    let consecutiveCancellationsMap = new Map<string, number>();
    let referralMap = new Map<string, any>();

    if (profileIds.length > 0) {
      if (roleFilter === 'RIDER') {
        const [completedRes, activeRes, recentReqsRes, referralRes] = await Promise.all([
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
          supabaseAdmin
            .from('captain_rider_referrals')
            .select(
              'id, rider_id, captain_id, last_interacted_at, last_inactivity_notified_at, created_at, profiles:captain_id(full_name, phone, serial_id)'
            )
            .in('rider_id', profileIds),
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
        for (const row of referralRes.data || []) {
          if (row.rider_id) {
            referralMap.set(row.rider_id, row);
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
          const profileRow = profiles.find((p) => p.id === rId);
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
            completedTripsMap.set(
              row.accepted_captain_id,
              (completedTripsMap.get(row.accepted_captain_id) || 0) + 1
            );
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
      supabaseAdmin
        .from('countries')
        .select('id, currency_ar, currency_en, name_ar, country_code')
        .order('id', { ascending: true }),
    ]);

    const govMap = new Map((govRes.data || []).map((g) => [g.id, g.name_ar]));
    const distMap = new Map((distRes.data || []).map((d) => [d.id, d.name_ar]));
    const countriesMap = new Map((countriesRes.data || []).map((c) => [c.id, c]));

    // Combine data
    const users = profiles.map((p) => {
      const w = walletMap.get(p.id) || {};
      const cap = captainProfilesMap.get(p.id) || {};

      const govName = p.governorate_id ? govMap.get(p.governorate_id) : p.governorate;
      const distName = p.district_id ? distMap.get(p.district_id) : p.district;
      const country = p.country_id ? countriesMap.get(p.country_id) : null;
      const isEgypt = p.country_id === 2 || String(p.phone || '').startsWith('+20');
      const currencyAr = country?.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');
      const currencyCode = country?.currency_en || w.currency_code || (isEgypt ? 'EGP' : 'JOD');

      let userStatus = (p.status || 'IDLE').toUpperCase();
      if (
        userStatus === 'BANNED' &&
        Array.isArray(p.rank_audit_log) &&
        p.rank_audit_log.includes('ACCOUNT_SUSPENDED')
      ) {
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
        preferred_language: p.preferred_language || 'ar',
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
          ? consecutiveCancellationsMap.get(p.id) || 0
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
        referral_activity: {
          has_referral: Boolean(referralMap.get(p.id)),
          referral_id: referralMap.get(p.id)?.id || null,
          captain_id: referralMap.get(p.id)?.captain_id || null,
          captain_name: (referralMap.get(p.id)?.profiles as any)?.full_name || null,
          captain_phone: (referralMap.get(p.id)?.profiles as any)?.phone || null,
          captain_serial: (referralMap.get(p.id)?.profiles as any)?.serial_id || null,
          last_interacted_at: referralMap.get(p.id)?.last_interacted_at || p.updated_at || p.created_at,
          days_inactive: referralMap.get(p.id)
            ? Math.max(
                0,
                Math.floor(
                  (Date.now() -
                    new Date(
                      referralMap.get(p.id).last_interacted_at || referralMap.get(p.id).created_at
                    ).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            : 0,
          is_active: referralMap.get(p.id)
            ? Math.max(
                0,
                Math.floor(
                  (Date.now() -
                    new Date(
                      referralMap.get(p.id).last_interacted_at || referralMap.get(p.id).created_at
                    ).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              ) < 10
            : true,
          last_notified_at: referralMap.get(p.id)?.last_inactivity_notified_at || null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      users,
      geo: {
        countries: (countriesRes.data || []).map((c) => ({
          id: c.id,
          name_ar: c.name_ar,
          country_code: c.country_code,
        })),
        governorates: (govRes.data || []).map((g) => ({
          id: g.id,
          name_ar: g.name_ar,
          country_id: g.country_id,
        })),
        districts: (distRes.data || []).map((d) => ({
          id: d.id,
          name_ar: d.name_ar,
          governorate_id: d.governorate_id,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Admin Users API] GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
