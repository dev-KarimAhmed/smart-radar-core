import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminRank, verifyAdminCaller } from '@/lib/admin-auth-verifier';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type {
  AnalyticsFilterState,
  AnalyticsPeriod,
  AnalyticsRoleFocus,
} from '@/features/admin/types/admin-analytics';
import { buildAdminAnalyticsPayload } from './analytics-aggregator';

const VALID_PERIODS = new Set<AnalyticsPeriod>(['all', '24h', '7d', '30d']);
const VALID_ROLES = new Set<AnalyticsRoleFocus>(['ALL', 'CAPTAIN', 'RIDER', 'TRIPS']);

export async function GET(req: Request) {
  try {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (getAdminRank(admin) !== 'GENERAL_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: General Admin access required' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const rawPeriod = (searchParams.get('period') || 'all') as AnalyticsPeriod;
    const rawRole = (searchParams.get('roleFocus') || 'ALL').toUpperCase() as AnalyticsRoleFocus;

    const filters: AnalyticsFilterState = {
      countryId: searchParams.get('countryId') || 'ALL',
      governorateId: searchParams.get('governorateId') || 'ALL',
      districtId: searchParams.get('districtId') || 'ALL',
      period: VALID_PERIODS.has(rawPeriod) ? rawPeriod : 'all',
      roleFocus: VALID_ROLES.has(rawRole) ? rawRole : 'ALL',
    };

    const [countriesRes, govRes, distRes, profilesRes, capRes, tripsRes, walletsRes] = await Promise.all([
      supabaseAdmin.from('countries').select('id, name_ar, country_code').order('id', { ascending: true }),
      supabaseAdmin.from('governorates').select('id, name_ar, country_id').order('id', { ascending: true }),
      supabaseAdmin.from('districts').select('id, name_ar, governorate_id').order('id', { ascending: true }),
      supabaseAdmin
        .from('profiles')
        .select('id, role, status, country_id, governorate_id, district_id, created_at')
        .in('role', ['CAPTAIN', 'RIDER', 'DELEGATE']),
      supabaseAdmin.from('captain_profiles').select('id, verification_status'),
      supabaseAdmin
        .from('ride_requests')
        .select('id, rider_id, accepted_captain_id, country_id, status, estimated_distance_km, created_at')
        .order('created_at', { ascending: false })
        .limit(5000),
      supabaseAdmin.from('wallet_accounts').select('profile_id, balance, paid_minutes_remaining'),
    ]);

    if (profilesRes.error) throw profilesRes.error;

    let activeAds = 0;
    let pendingAds = 0;
    try {
      const promosSnap = await getDocs(collection(db, 'promos'));
      promosSnap.forEach((doc) => {
        const status = String(doc.data().status || '').toLowerCase();
        if (status === 'active') activeAds++;
        else if (status === 'pending') pendingAds++;
      });
    } catch (adErr) {
      console.warn('[Admin Analytics] Firestore promo read skipped:', adErr);
    }

    const analytics = buildAdminAnalyticsPayload({
      filters,
      countries: countriesRes.data || [],
      governorates: govRes.data || [],
      districts: distRes.data || [],
      profiles: profilesRes.data || [],
      captainProfiles: capRes.data || [],
      trips: tripsRes.data || [],
      wallets: walletsRes.data || [],
      activeAds,
      pendingAds,
    });

    return NextResponse.json({ success: true, analytics });
  } catch (err: any) {
    console.error('[Admin Analytics API Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to compute analytics' },
      { status: 500 },
    );
  }
}
