import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller } from '@/lib/admin-auth-verifier';

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  try {

    const { data: admins, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, email, status, created_at')
      .eq('role', 'ADMIN')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, admins: admins || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}

