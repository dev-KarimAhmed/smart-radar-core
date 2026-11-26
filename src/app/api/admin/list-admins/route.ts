import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
  getAdminAllowedPermissions,
  getAdminAllowedSectors,
  getAdminGeoScope,
  getAdminRank,
  verifyAdminCaller,
} from '@/lib/admin-auth-verifier';
import { fetchGeoLookups } from '@/app/api/admin/users/services/users-query-builder';

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  try {
    const callerRank = getAdminRank(admin);
    const callerAllowedSectors = getAdminAllowedSectors(admin);
    const callerAllowedPermissions = getAdminAllowedPermissions(admin);
    const callerGeoScope = getAdminGeoScope(admin);

    const [{ data: admins, error }, geoLookups] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone, email, status, created_at, rank_audit_log, allowed_sectors, country_id, governorate_id, district_id')
        .eq('role', 'ADMIN')
        .order('created_at', { ascending: false }),
      fetchGeoLookups(),
    ]);

    if (error) throw error;

    const mappedAdmins = (admins || []).map((adm) => {
      const rank = getAdminRank(adm);
      const isPrimary =
        adm.id === PRIMARY_SOVEREIGN_ADMIN_ID ||
        adm.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE ||
        adm.phone === '+201551981977' ||
        adm.phone === '201551981977';
      return {
        id: adm.id,
        full_name: adm.full_name,
        phone: adm.phone,
        email: adm.email,
        status: adm.status,
        created_at: adm.created_at,
        admin_rank: rank,
        admin_rank_label: rank === 'GENERAL_ADMIN' ? 'مشرف عام' : 'مشرف مساعد',
        is_primary: isPrimary,
        allowed_sectors: getAdminAllowedSectors(adm),
        allowed_permissions: getAdminAllowedPermissions(adm),
        geo_scope: getAdminGeoScope(adm),
      };
    });

    return NextResponse.json({
      success: true,
      admins: mappedAdmins,
      callerRank,
      callerId: admin.id,
      callerAllowedSectors,
      callerAllowedPermissions,
      callerGeoScope,
      geo: geoLookups.geo,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
