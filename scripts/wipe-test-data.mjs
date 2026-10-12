import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function wipeDatabase() {
  console.log('====================================================');
  console.log('🧹 STARTING DATABASE CLEANUP (CLEAN SLATE TESTING)');
  console.log('====================================================');

  // 1. Wipe Operational Tables
  const wipePlan = [
    { name: 'ride_offers', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'ride_requests', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'trips_72h_ledger', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'reviews', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'user_blocks', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'rider_favorite_captains', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'user_notifications', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'captain_locations', filter: (q) => q.not('captain_id', 'is', null) },
    { name: 'wallet_transactions', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'wallet_vouchers', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'wallet_accounts', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'rider_ratings', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'ad_favorites', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'password_reset_requests', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'password_reset_audit', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'captain_profiles', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
    { name: 'profiles', filter: (q) => q.neq('id', '00000000-0000-0000-0000-000000000000') },
  ];

  for (const item of wipePlan) {
    const { count: beforeCount } = await supabase.from(item.name).select('*', { count: 'exact', head: true });
    process.stdout.write(`Wiping ${item.name} (${beforeCount ?? 0} rows)... `);
    const query = supabase.from(item.name).delete();
    const { error } = await item.filter(query);
    if (error) {
      console.log(`❌ ERROR: ${error.message}`);
    } else {
      console.log(`✅ Cleared`);
    }
  }

  // 2. Wipe Auth Users
  console.log('\n--- Wiping Auth Users ---');
  let authUsersRemaining = true;
  let totalDeletedUsers = 0;

  while (authUsersRemaining) {
    const { data: userPage, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (listErr) {
      console.error('Failed to list auth users:', listErr.message);
      break;
    }
    if (!userPage || !userPage.users || userPage.users.length === 0) {
      authUsersRemaining = false;
      break;
    }

    for (const u of userPage.users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) {
        console.warn(`Failed to delete user ${u.id} (${u.phone || u.email}): ${delErr.message}`);
      } else {
        totalDeletedUsers++;
      }
    }
  }
  console.log(`✅ Successfully deleted ${totalDeletedUsers} auth users.`);

  // 3. Verify clean state
  console.log('\n====================================================');
  console.log('🔍 FINAL STATUS VERIFICATION:');
  console.log('====================================================');

  const checkTables = [
    'profiles', 'captain_profiles', 'ride_requests', 'ride_offers',
    'trips_72h_ledger', 'captain_locations', 'wallet_transactions',
    'reviews', 'user_blocks', 'password_reset_audit'
  ];

  for (const t of checkTables) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`Table ${t.padEnd(25)}: ${count} rows`);
  }

  const { data: finalAuth } = await supabase.auth.admin.listUsers({ page: 1, perPage: 10 });
  console.log(`Auth users count           : ${finalAuth?.users?.length ?? 0} users`);

  console.log('\n--- Geographic & Reference Data Check (Preserved) ---');
  for (const ref of ['countries', 'governorates', 'districts', 'app_flags']) {
    const { count } = await supabase.from(ref).select('*', { count: 'exact', head: true });
    console.log(`Table ${ref.padEnd(25)}: ${count} rows (PRESERVED)`);
  }

  console.log('\n✨ Database is completely wiped and ready for clean testing!');
}

wipeDatabase().catch(console.error);

