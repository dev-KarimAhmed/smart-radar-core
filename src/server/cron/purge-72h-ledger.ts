import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { supabaseAdmin } from '../../lib/supabase-admin';

export interface PurgeResult {
  tripsDeleted: number;
  notificationsDeleted: number;
  requestsDeleted: number;
  offersDeleted: number;
  timestamp: string;
}

/**
 * 72-Hour Sovereign Data Purge
 * Enforces Protocol 72h rule: Completely purges trips, ride requests, ride offers,
 * and associated trip notifications older than 72 hours from the server.
 */
export async function runSovereign72hPurge(): Promise<PurgeResult> {
  const cutoffTime = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const cutoffIso = cutoffTime.toISOString();

  let tripsDeleted = 0;
  let notificationsDeleted = 0;
  let requestsDeleted = 0;
  let offersDeleted = 0;

  try {
    // 1. Purge trips_72h_ledger via RPC and direct delete
    try {
      const { data: rpcCount, error: rpcErr } = await supabaseAdmin.rpc('purge_expired_72h_trips');
      if (!rpcErr && typeof rpcCount === 'number') {
        tripsDeleted += rpcCount;
      }
    } catch {}

    try {
      const { count } = await supabaseAdmin
        .from('trips_72h_ledger')
        .delete({ count: 'exact' })
        .or(`purge_at.lt.${new Date().toISOString()},completed_at.lt.${cutoffIso}`);
      if (count) tripsDeleted += count;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[72h Purge] Ledger direct delete warning:', err);
    }

    // 2. Purge trip and offer notifications older than 72 hours
    try {
      const { count } = await supabaseAdmin
        .from('user_notifications')
        .delete({ count: 'exact' })
        .in('type', ['trip', 'offer'])
        .lt('created_at', cutoffIso);
      if (count) notificationsDeleted += count;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[72h Purge] Notifications purge warning:', err);
    }

    // 3. Purge ride requests older than 72 hours and their offers/reviews
    try {
      const { data: oldRequests } = await supabaseAdmin
        .from('ride_requests')
        .select('id')
        .lt('created_at', cutoffIso)
        .limit(500);

      if (oldRequests && oldRequests.length > 0) {
        const reqIds = oldRequests.map((r: any) => r.id);

        try {
          await supabaseAdmin
            .from('reviews')
            .delete()
            .in('trip_id', reqIds);
        } catch {}

        const { count: offCount } = await supabaseAdmin
          .from('ride_offers')
          .delete({ count: 'exact' })
          .in('request_id', reqIds);
        if (offCount) offersDeleted += offCount;

        const { count: rqCount } = await supabaseAdmin
          .from('ride_requests')
          .delete({ count: 'exact' })
          .in('id', reqIds);
        if (rqCount) requestsDeleted += rqCount;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[72h Purge] Requests purge warning:', err);
    }

    console.log(
      `[Sovereign 72h Purge] Completed: ${tripsDeleted} trips, ${notificationsDeleted} notifications, ${requestsDeleted} requests, ${offersDeleted} offers purged.`
    );
  } catch (err) {
    console.error('[Sovereign 72h Purge Execution Error]:', err);
  }

  return {
    tripsDeleted,
    notificationsDeleted,
    requestsDeleted,
    offersDeleted,
    timestamp: new Date().toISOString(),
  };
}

let purgeIntervalStarted = false;

export function initSovereign72hPurgeWorker(): void {
  if (purgeIntervalStarted) return;
  purgeIntervalStarted = true;

  // Run initial sweep 10 seconds after server boot
  setTimeout(() => {
    void runSovereign72hPurge();
  }, 10_000);

  // Scheduled sweep every 1 hour (3600_000 ms)
  setInterval(() => {
    void runSovereign72hPurge();
  }, 60 * 60 * 1000);

  console.log('[Sovereign 72h Purge Worker] Initialized and scheduled (every 1 hour).');
}
