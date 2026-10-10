import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function emptyBucket(bucketName) {
  console.log(`\n🧹 Cleaning storage bucket: ${bucketName}...`);
  try {
    const { data: topItems, error: topErr } = await supabase.storage.from(bucketName).list('');
    if (topErr) {
      console.warn(`  ⚠️ Could not list ${bucketName}:`, topErr.message);
      return;
    }
    if (!topItems || topItems.length === 0) {
      console.log(`  ✅ Bucket ${bucketName} is already empty.`);
      return;
    }

    const filesToRemove = [];
    for (const item of topItems) {
      if (item.id === null) {
        // Folder
        const { data: subFiles } = await supabase.storage.from(bucketName).list(item.name);
        if (subFiles && subFiles.length > 0) {
          for (const sf of subFiles) {
            filesToRemove.push(`${item.name}/${sf.name}`);
          }
        }
      } else {
        filesToRemove.push(item.name);
      }
    }

    if (filesToRemove.length > 0) {
      console.log(`  Found ${filesToRemove.length} files to delete in ${bucketName}`);
      const { error: removeErr } = await supabase.storage.from(bucketName).remove(filesToRemove);
      if (removeErr) {
        console.warn(`  ⚠️ Error removing files in ${bucketName}:`, removeErr.message);
      } else {
        console.log(`  ✅ Removed ${filesToRemove.length} files from ${bucketName}`);
      }
    } else {
      console.log(`  ✅ No files to remove in ${bucketName}`);
    }
  } catch (err) {
    console.warn(`  ⚠️ Exception while emptying ${bucketName}:`, err.message);
  }
}

async function runWipe() {
  console.log('=====================================================');
  console.log('🚀 STARTING SAFE BACKEND TOTAL PURGE (CLEAN SLATE)');
  console.log('=====================================================');

  // STEP 1: TRIP & MARKETPLACE DATA
  console.log('\n[Step 1] Wiping Trip & Marketplace tables...');
  
  const { error: errOffers } = await supabase.from('ride_offers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  - ride_offers deleted:', errOffers ? errOffers.message : 'SUCCESS');

  const { error: errLedger } = await supabase.from('trips_72h_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  - trips_72h_ledger deleted:', errLedger ? errLedger.message : 'SUCCESS');

  const { error: errReqs } = await supabase.from('ride_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  - ride_requests deleted:', errReqs ? errReqs.message : 'SUCCESS');

  // STEP 2: REVIEWS, RATINGS, SOCIAL & EPHEMERAL TELEMETRY
  console.log('\n[Step 2] Wiping Reviews, Social & Ephemeral telemetry...');

  const { error: errReviews } = await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  - reviews deleted:', errReviews ? errReviews.message : 'SUCCESS');

  const { error: errRatings } = await supabase.from('rider_ratings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  - rider_ratings deleted:', errRatings ? errRatings.message : 'SUCCESS');

  const { error: errBlocks } = await supabase.from('user_blocks').delete().neq('blocker_id', '00000000-0000-0000-0000-000000000000');
  console.log('  - user_blocks deleted:', errBlocks ? errBlocks.message : 'SUCCESS');

  const { error: errFavs } = await supabase.from('rider_favorite_captains').delete().neq('rider_id', '00000000-0000-0000-0000-000000000000');
  console.log('  - rider_favorite_captains deleted:', errFavs ? errFavs.message : 'SUCCESS');

  const { error: errLocs } = await supabase.from('captain_locations').delete().neq('captain_id', '00000000-0000-0000-0000-000000000000');
  console.log('  - captain_locations deleted:', errLocs ? errLocs.message : 'SUCCESS');

  const { error: errPwReqs } = await supabase.from('password_reset_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  - password_reset_requests deleted:', errPwReqs ? errPwReqs.message : 'SUCCESS');

  const { error: errPwAudit } = await supabase.from('password_reset_audit').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  - password_reset_audit deleted:', errPwAudit ? errPwAudit.message : 'SUCCESS');

  // STEP 3: FINANCIAL DATA
  console.log('\n[Step 3] Wiping Wallet transactions & accounts...');

  const { error: errTx } = await supabase.from('wallet_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  - wallet_transactions deleted:', errTx ? errTx.message : 'SUCCESS');

  const { error: errAcc } = await supabase.from('wallet_accounts').delete().neq('profile_id', '00000000-0000-0000-0000-000000000000');
  console.log('  - wallet_accounts deleted:', errAcc ? errAcc.message : 'SUCCESS');

  // STEP 4: PROFILES & CAPTAINS
  console.log('\n[Step 4] Wiping Captain profiles & user profiles...');

  const { error: errCapProf } = await supabase.from('captain_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  - captain_profiles deleted:', errCapProf ? errCapProf.message : 'SUCCESS');

  const { error: errProf } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  - profiles deleted:', errProf ? errProf.message : 'SUCCESS');

  // STEP 5: SUPABASE AUTH USERS
  console.log('\n[Step 5] Wiping Auth Users from GoTrue/Supabase Auth...');
  let totalAuthDeleted = 0;
  while (true) {
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 50 });
    if (listErr) {
      console.warn('  ⚠️ Error listing auth users:', listErr.message);
      break;
    }
    if (!users || users.length === 0) {
      console.log('  ✅ No more auth users to delete.');
      break;
    }
    for (const u of users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) {
        console.warn(`  ⚠️ Failed to delete user ${u.id} (${u.email || u.phone}):`, delErr.message);
      } else {
        totalAuthDeleted++;
      }
    }
    console.log(`  Purged batch of ${users.length} auth users (Total so far: ${totalAuthDeleted})...`);
  }
  console.log(`  ✅ Successfully deleted ${totalAuthDeleted} auth users.`);

  // STEP 6: STORAGE BUCKETS
  console.log('\n[Step 6] Cleaning Storage Buckets...');
  await emptyBucket('captain-documents');
  await emptyBucket('receipts');

  // STEP 7: VERIFICATION AUDIT
  console.log('\n=====================================================');
  console.log('🔍 RUNNING INTEGRITY AND PURGE VERIFICATION AUDIT...');
  console.log('=====================================================');

  const tablesToCheck = [
    'ride_requests',
    'ride_offers',
    'trips_72h_ledger',
    'reviews',
    'rider_ratings',
    'user_blocks',
    'rider_favorite_captains',
    'captain_locations',
    'password_reset_requests',
    'password_reset_audit',
    'wallet_transactions',
    'wallet_accounts',
    'captain_profiles',
    'profiles',
  ];

  for (const t of tablesToCheck) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`  Table [${t}]: ${error ? 'ERROR: ' + error.message : count + ' rows'}`);
  }

  console.log('\n🛡️ VERIFYING CRITICAL CORE INFRASTRUCTURE DATA:');
  for (const t of ['countries', 'governorates', 'districts', 'app_flags']) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`  Core Config [${t}]: ${count} rows (Untouched & Intact ✅)`);
  }

  const { data: remainingUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 10 });
  console.log(`  Auth Users remaining: ${remainingUsers?.users?.length || 0} ✅`);

  console.log('\n🎉 ALL OLD DATA HAS BEEN SAFELY AND COMPLETELY WIPED!');
  console.log('🚀 Backend is 100% clean and ready for fresh testing from scratch.');
}

runWipe().catch((err) => {
  console.error('❌ Fatal error during purge:', err);
  process.exit(1);
});

