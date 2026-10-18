import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestedStatus = String(body.status || '').toLowerCase().trim();
    const explicitUid = body.uid ? String(body.uid) : null;

    if (requestedStatus !== 'active' && requestedStatus !== 'idle') {
      return NextResponse.json({ success: false, error: 'invalid_captain_status' }, { status: 400 });
    }

    // 1. Resolve user ID from Authorization header or explicitUid
    let uid: string | null = null;
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (token) {
      try {
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user?.id) {
          uid = authData.user.id;
        }
      } catch {}
    }

    if (!uid && explicitUid) {
      uid = explicitUid;
    }

    if (!uid) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    // 2. Fetch current profile to ensure user is a captain and not banned/suspended
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, status, rank_audit_log')
      .eq('id', uid)
      .maybeSingle();

    if (pErr || !profile) {
      return NextResponse.json({ success: false, error: 'captain_profile_not_found' }, { status: 404 });
    }

    const currentStatus = String(profile.status || '').toUpperCase();
    if (currentStatus === 'BANNED') {
      return NextResponse.json({ success: false, error: 'captain_account_banned' }, { status: 403 });
    }
    if (currentStatus === 'SUSPENDED' && requestedStatus === 'active') {
      return NextResponse.json({ success: false, error: 'captain_account_suspended' }, { status: 403 });
    }

    const targetStatusUpper = requestedStatus.toUpperCase();

    // 3. Update profile status in profiles table
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        status: targetStatusUpper,
        updated_at: new Date().toISOString(),
      })
      .eq('id', uid);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // 4. Ensure wallet account has future expiration so other legacy checks don't complain
    if (requestedStatus === 'active') {
      const farFuture = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('wallet_accounts')
        .update({
          time_bundle_expires_at: farFuture,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', uid);
    } else if (requestedStatus === 'idle') {
      // Cancel/delete pending ride offers
      await supabaseAdmin
        .from('ride_offers')
        .update({ status: 'CANCELLED' })
        .eq('captain_id', uid);
      await supabaseAdmin
        .from('ride_offers')
        .delete()
        .eq('captain_id', uid);
    }

    return NextResponse.json({
      success: true,
      status: requestedStatus,
      profile_id: uid,
      has_active_bundle: true,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'internal_error' }, { status: 500 });
  }
}

