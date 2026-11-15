/**
 * Cancel Offer RPC and API call service for Driver Transactions.
 */

import { supabase } from '@/lib/supabase-client';

export async function executeCaptainOfferCancel(
  targetRequestId: string,
  captainId: string
): Promise<{ success: boolean; alreadyAccepted?: boolean; error?: string }> {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  let apiSuccess = false;

  try {
    const res = await fetch('/api/captain/cancel-offer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ requestId: targetRequestId, uid: captainId }),
    });

    const data = await res.json();
    if (res.status === 409 || data.error === 'offer_already_accepted') {
      return { success: false, alreadyAccepted: true };
    }

    if (res.ok && data.success) {
      apiSuccess = true;
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] cancel-offer API route error:', e);
  }

  if (!apiSuccess) {
    const { error: rpcErr } = await supabase.rpc('cancel_ride_offer', {
      p_request_id: targetRequestId,
    });

    if (rpcErr) {
      if (rpcErr.message?.includes('offer_already_accepted')) {
        return { success: false, alreadyAccepted: true };
      }
      await supabase
        .from('ride_offers')
        .delete()
        .eq('request_id', targetRequestId)
        .eq('captain_id', captainId)
        .neq('status', 'ACCEPTED');
    }
  }

  return { success: true };
}
