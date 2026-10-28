import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  verifyAdminCaller,
  getAdminRank,
  getAdminAllowedSectors,
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
} from '@/lib/admin-auth-verifier';

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  try {
    const callerRank = getAdminRank(admin);
    const callerAllowedSectors = getAdminAllowedSectors(admin);

    const { data: admins, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, email, status, created_at, rank_audit_log, allowed_sectors')
      .eq('role', 'ADMIN')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mappedAdmins = (admins || []).map((adm) => {
      const rank = getAdminRank(adm);
      const isPrimary = adm.id === PRIMARY_SOVEREIGN_ADMIN_ID || adm.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE;
      const sectors = getAdminAllowedSectors(adm);
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
        allowed_sectors: sectors,
      };
    });

    return NextResponse.json({
      success: true,
      admins: mappedAdmins,
      callerRank,
      callerId: admin.id,
      callerAllowedSectors,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}

