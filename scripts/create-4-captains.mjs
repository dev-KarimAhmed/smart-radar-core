import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ خطأ: لم يتم العثور على NEXT_PUBLIC_SUPABASE_URL في ملف .env');
  process.exit(1);
}

const isServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log(`ℹ️ نوع مفتاح Supabase المستعمل: ${isServiceRole ? 'Service Role (Admin)' : 'Anon Key (Client Sign-Up)'}`);

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CAPTAINS_DATA = [
  {
    name: 'الكابتن أحمد علي',
    email: 'captain1@radar.com',
    phone: '+201000000001',
    password: '123456',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Corolla 2023',
    plateNumber: 'أ ج ب 1234',
  },
  {
    name: 'الكابتن محمد حسن',
    email: 'captain2@radar.com',
    phone: '+201000000002',
    password: '123456',
    vehicleBrand: 'Hyundai',
    vehicleModel: 'Elantra 2022',
    plateNumber: 'س ص ع 5678',
  },
  {
    name: 'الكابتن محمود السيد',
    email: 'captain3@radar.com',
    phone: '+201000000003',
    password: '123456',
    vehicleBrand: 'Kia',
    vehicleModel: 'Cerato 2024',
    plateNumber: 'د ذ ر 9012',
  },
  {
    name: 'الكابتن مصطفى خالد',
    email: 'captain4@radar.com',
    phone: '+201000000004',
    password: '123456',
    vehicleBrand: 'Nissan',
    vehicleModel: 'Sunny 2023',
    plateNumber: 'ط ظ ع 3456',
  },
];

async function main() {
  console.log('====================================================');
  console.log('🚀 إنشاء وإعداد 4 كباتن كلمة المرور الموحدة: 123456');
  console.log('====================================================\n');

  // Default to Egypt (country_id: 2, governorate_id: 14, district_id: 19, 6th of October) where testing takes place
  let defaultCountryId = 2;
  let defaultGovId = 14;
  let defaultDistrictId = 19;
  const defaultLat = 29.9578;
  const defaultLng = 30.8972;
  const defaultH3Cell = '893e62d580fffff';

  const createdCaptains = [];

  for (let i = 0; i < CAPTAINS_DATA.length; i++) {
    const cap = CAPTAINS_DATA[i];
    console.log(`⏳ جاري إنشاء/تحديث الكابتن (${i + 1}/4): ${cap.name} | ${cap.email} | ${cap.phone}...`);

    let userId = null;

    if (isServiceRole) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = listData?.users?.find(
        (u) => u.email?.toLowerCase() === cap.email.toLowerCase() || u.phone === cap.phone
      );

      if (existingUser) {
        userId = existingUser.id;
        console.log(`   ℹ️ الحساب موجود بالفعل (ID: ${userId})، جاري تحديث كلمة المرور والبيانات...`);
        const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
          password: cap.password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { role: 'CAPTAIN', full_name: cap.name, phone: cap.phone },
        });
        if (updateErr) console.warn(`   ⚠️ تحديث كلمة المرور:`, updateErr.message);
      } else {
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: cap.email,
          phone: cap.phone,
          password: cap.password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { role: 'CAPTAIN', full_name: cap.name, phone: cap.phone },
        });
        if (createErr) {
          console.error(`   ❌ خطأ إنشاء الحساب:`, createErr.message);
          continue;
        }
        userId = newUser.user.id;
        console.log(`   ✅ تم إنشاء الحساب (ID: ${userId})`);
      }
    } else {
      // Use standard Auth SignUp via Phone / Email
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        phone: cap.phone,
        password: cap.password,
        options: {
          data: {
            role: 'CAPTAIN',
            full_name: cap.name,
            phone: cap.phone,
            email: cap.email,
            country_id: defaultCountryId,
            governorate_id: defaultGovId,
            district_id: defaultDistrictId,
          },
        },
      });
      if (signUpData?.user) userId = signUpData.user.id;
    }

    // Authenticate as captain to get session access_token
    let captainAccessToken = null;
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      phone: cap.phone,
      password: cap.password,
    });
    if (signInData?.session?.access_token) {
      captainAccessToken = signInData.session.access_token;
      userId = signInData.user.id;
      console.log(`   ✅ تم توثيق الكابتن وتوليد جلسة بنجاح (ID: ${userId})`);
    } else {
      console.warn(`   ⚠️ خطأ توثيق الكابتن:`, signInErr?.message);
    }

    if (!userId) {
      console.warn(`   ⚠️ تعذر الحصول على ID للكابتن ${cap.name}`);
      continue;
    }

    // Upsert into profiles
    const { error: profileErr } = await supabase.from('profiles').upsert(
      {
        id: userId,
        role: 'CAPTAIN',
        full_name: cap.name,
        phone: cap.phone,
        status: 'ACTIVE',
        country_id: defaultCountryId,
        governorate_id: defaultGovId,
        district_id: defaultDistrictId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (profileErr) console.warn(`   ⚠️ ملف Profile:`, profileErr.message);

    // Upsert into captain_profiles
    const { error: capProfileErr } = await supabase.from('captain_profiles').upsert(
      {
        id: userId,
        verification_status: 'APPROVED',
        vehicle_type: 'SECTOR_SEDAN',
        vehicle_brand: cap.vehicleBrand,
        vehicle_model: cap.vehicleModel,
        vehicle_color: 'أبيض',
        vehicle_year: 2023,
        plate_number: cap.plateNumber,
        employment_type: 'INDEPENDENT',
        affiliation_type: 'INDEPENDENT',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (capProfileErr) console.warn(`   ⚠️ ملف Captain Profile:`, capProfileErr.message);

    if (captainAccessToken) {
      const captainClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${captainAccessToken}` } },
      });

      // Update location via pulse_captain_location RPC
      const { error: pulseErr } = await captainClient.rpc('pulse_captain_location', {
        p_lat: defaultLat,
        p_lng: defaultLng,
        p_h3_cell: defaultH3Cell,
      });
      if (pulseErr) console.warn(`   ⚠️ موقع الكابتن Location:`, pulseErr.message);

      // Try captain_self_topup RPC to add 1000 radar minutes and 100 balance
      const { error: topupErr } = await captainClient.rpc('captain_self_topup', {
        p_amount: 100,
        p_minutes: 1000,
      });
      if (topupErr) console.warn(`   ⚠️ محفظة الكابتن Wallet:`, topupErr.message);
    }

    createdCaptains.push({
      '#': i + 1,
      'الاسم': cap.name,
      'الايميل': cap.email,
      'رقم الهاتف': cap.phone,
      'كلمة المرور': cap.password,
      'الحالة': 'مفعل جاهز ✅',
    });
  }

  console.log('\n====================================================');
  console.log('✨ تم الإعداد بنجاح! ملخص بيانات الكباتن الأربعة:');
  console.log('====================================================');
  console.table(createdCaptains);
}

main().catch((err) => {
  console.error('💥 حدث خطأ غير متوقع:', err);
  process.exit(1);
});
