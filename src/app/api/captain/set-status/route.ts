import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { grantNewCaptainWelcomeCredit } from '@/features/captain/services/captain-welcome-credit';
import { getVerifiedUser } from '@/shared/server/api-auth-guard';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedStatus = String(body.status || '').toLowerCase().trim();

    if (requestedStatus !== 'active' && requestedStatus !== 'idle') {
      return NextResponse.json({ success: false, error: 'invalid_captain_status' }, { status: 400 });
    }

    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    if (caller.role !== 'CAPTAIN' && caller.role !== 'DRIVER') {
      return NextResponse.json({ success: false, error: 'only_captains_can_update_status' }, { status: 403 });
    }

    const uid = caller.id;
    const isAccountSuspended =
      caller.status === 'SUSPENDED' ||
      (Array.isArray(caller.rankAuditLog) && caller.rankAuditLog.includes('ACCOUNT_SUSPENDED'));

    if (isAccountSuspended && requestedStatus === 'active') {
      return NextResponse.json({ success: false, error: 'captain_account_suspended' }, { status: 403 });
    }

    const targetStatusUpper = requestedStatus.toUpperCase();

    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        status: targetStatusUpper,
        updated_at: new Date().toISOString(),
      })
      .eq('id', uid);

    if (updateErr) {
      console.error('[captain/set-status] profile update error:', updateErr);
      return NextResponse.json({ success: false, error: 'status_update_failed' }, { status: 500 });
    }

    if (requestedStatus === 'active') {
      try {
        await grantNewCaptainWelcomeCredit(uid);
      } catch {}

      const farFuture = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('wallet_accounts')
        .update({
          time_bundle_expires_at: farFuture,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', uid);
    } else if (requestedStatus === 'idle') {
      await supabaseAdmin
        .from('ride_offers')
        .update({ status: 'CANCELLED' })
        .eq('captain_id', uid)
        .neq('status', 'ACCEPTED');
      await supabaseAdmin
        .from('ride_offers')
        .delete()
        .eq('captain_id', uid)
        .neq('status', 'ACCEPTED');
    }

    return NextResponse.json({
      success: true,
      status: requestedStatus,
      profile_id: uid,
      has_active_bundle: true,
    });
  } catch (err) {
    console.error('[captain/set-status] unexpected error:', err);
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 });
  }
}
