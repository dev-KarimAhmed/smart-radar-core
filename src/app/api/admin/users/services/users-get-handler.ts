/**
 * GET Handler for Admin Users API Route.
 * Fetches, enriches, and batches profiles, wallets, verification, trips, and lookup tables.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hasAdminSectorAccess } from '@/lib/admin-auth-verifier';
import { mapEnrichedUser } from './users-get-mapper';
import { buildFilteredProfilesQuery, fetchGeoLookups } from './users-query-builder';

export async function handleUsersGet(req: Request, admin: any) {
  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get('role')?.toUpperCase() || 'CAPTAIN';
  const targetSector = roleFilter === 'CAPTAIN' ? 'captains' : 'riders';
  const metaOnly = searchParams.get('metaOnly') === '1';

  if (!hasAdminSectorAccess(admin, targetSector)) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: ليس لديك صلاحية الوصول لهذا القطاع' },
      { status: 403 }
    );
  }

  try {
    const targetRole = roleFilter === 'CAPTAIN' ? 'CAPTAIN' : 'RIDER';

    if (metaOnly) {
      const [lookups, countRes] = await Promise.all([
        fetchGeoLookups(),
        supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', targetRole),
      ]);
      return NextResponse.json({
        success: true,
        users: [],
        totalCount: countRes.count ?? 0,
        geo: lookups.geo,
      });
    }

    const [{ data: profiles, error: pErr }, lookups] = await Promise.all([
      buildFilteredProfilesQuery(targetRole, {
        countryId: searchParams.get('countryId') || 'ALL',
        governorateId: searchParams.get('governorateId') || 'ALL',
        districtId: searchParams.get('districtId') || 'ALL',
        status: searchParams.get('status') || 'ALL',
        tier: searchParams.get('tier') || 'ALL',
        language: searchParams.get('language') || 'ALL',
        q: searchParams.get('q') || '',
      }),
      fetchGeoLookups(),
    ]);

    if (pErr) throw pErr;
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, users: [], geo: lookups.geo });
    }

    const profileIds = profiles.map(p => p.id);

    const { data: wallets } = await supabaseAdmin
      .from('wallet_accounts')
      .select('*')
      .in('profile_id', profileIds);

    const walletMap = new Map((wallets || []).map(w => [w.profile_id, w]));

    let captainProfilesMap = new Map();
    if (roleFilter === 'CAPTAIN') {
      const { data: caps } = await supabaseAdmin
        .from('captain_profiles')
        .select('*')
        .in('id', profileIds);

      captainProfilesMap = new Map((caps || []).map(c => [c.id, c]));
    }

    const completedTripsMap = new Map<string, number>();
    const activeRequestsMap = new Map<string, string>();
    const consecutiveCancellationsMap = new Map<string, number>();
    const referralMap = new Map<string, any>();

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
            .select('id, rider_id, captain_id, last_interacted_at, last_inactivity_notified_at, created_at, profiles:captain_id(full_name, phone, serial_id)')
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

        const riderRecentReqs = new Map<string, Array<{ status: string; created_at: string }>>();
        for (const req of recentReqsRes.data || []) {
          if (!req.rider_id) continue;
          if (!riderRecentReqs.has(req.rider_id)) {
            riderRecentReqs.set(req.rider_id, []);
          }
          riderRecentReqs.get(req.rider_id)!.push(req);
        }

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

    const { govRes, distRes, countriesRes, geo } = lookups;

    const govMap = new Map((govRes.data || []).map(g => [g.id, g.name_ar]));
    const distMap = new Map((distRes.data || []).map(d => [d.id, d.name_ar]));
    const countriesMap = new Map((countriesRes.data || []).map(c => [c.id, c]));

    const users = profiles.map(p =>
      mapEnrichedUser({
        p,
        walletMap,
        captainProfilesMap,
        govMap,
        distMap,
        countriesMap,
        completedTripsMap,
        activeRequestsMap,
        consecutiveCancellationsMap,
        referralMap,
      })
    );

    return NextResponse.json({
      success: true,
      users,
      geo,
    });
  } catch (error: any) {
    console.error('[Admin Users API] GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch users' }, { status: 500 });
  }
}
