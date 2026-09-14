import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);

function hasFlag(flag) {
  return args.includes(flag);
}

function getArg(name, defaultValue = null) {
  const index = args.indexOf(name);
  if (index !== -1 && args[index + 1]) return args[index + 1];
  return defaultValue;
}

const IS_HELP = hasFlag('--help') || hasFlag('-h');
const IS_DRY_RUN = hasFlag('--dry-run');
const IS_CLEAN_REQUESTS = hasFlag('--clean-requests') || hasFlag('--clean-trips');
const IS_SET_DEFAULTS = hasFlag('--set-defaults');
const TARGET_COUNTRY_ID = getArg('--country') ? parseInt(getArg('--country'), 10) : null;

if (IS_HELP) {
  console.log(`
===================================================================
🛠️  أداة تصفير وإعادة ضبط متوسط أسعار السوق (Market Pricing Reset)
===================================================================

الاستخدام:
  node scripts/reset-market-pricing.mjs [خيارات]
  أو عبر: npm run reset:pricing

الخيارات المتاحة:
  --clean-requests, --clean-trips  حذف طلبات وعروض الرحلات الاختبارية العالقة في قاعدة البيانات.
  --set-defaults                  تعيين تسعيرة الكباتن وفق الحد القانوني الرسمي لكل دولة بدلاً من NULL.
  --country <id>                  تطبيق التصفير على دولة محددة فقط (مثال: --country 2 لمصر، أو --country 1 للأردن).
  --dry-run                       معاينة التغييرات وفحص الأسعار دون تعديل أي بيانات فعلية.
  --help, -h                      عرض هذه المساعدة.

أمثلة:
  node scripts/reset-market-pricing.mjs
  node scripts/reset-market-pricing.mjs --clean-requests
  node scripts/reset-market-pricing.mjs --country 2 --clean-requests
===================================================================
`);
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ خطأ: لم يتم العثور على NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY في ملف .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getMarketState(countries) {
  const state = [];
  for (const country of countries) {
    let tariff = null;
    try {
      const { data } = await supabase.rpc('market_average_tariff', { p_country_id: country.id });
      tariff = data;
    } catch {
      tariff = null;
    }

    const { data: profilesInCountry } = await supabase
      .from('profiles')
      .select('id')
      .eq('country_id', country.id)
      .eq('role', 'CAPTAIN');

    const captainIds = (profilesInCountry || []).map(p => p.id);

    let pricedCount = 0;
    if (captainIds.length > 0) {
      const { data: pricedCaptains } = await supabase
        .from('captain_profiles')
        .select('id')
        .in('id', captainIds)
        .not('base_fare', 'is', null)
        .not('price_per_km', 'is', null)
        .not('price_per_min', 'is', null);

      pricedCount = pricedCaptains?.length || 0;
    }

    state.push({
      country,
      totalCaptains: captainIds.length,
      pricedCaptains: pricedCount,
      marketTariff: tariff,
    });
  }
  return state;
}

function printStateTable(title, stateList) {
  console.log(`\n📊 ${title}:`);
  console.log('─'.repeat(72));
  stateList.forEach(({ country, totalCaptains, pricedCaptains, marketTariff }) => {
    const cur = country.currency_ar || country.currency_en || '';
    const src = marketTariff?.source === 'country_seed' ? '🌱 بذرة الدولة (رسمي)' : '👥 متوسط الكباتن (سوق)';
    const scope = marketTariff?.scope || 'country_seed';
    const base = marketTariff?.baseFare ?? country.base_fare;
    const km = marketTariff?.perKm ?? country.per_km_rate;
    const min = marketTariff?.perMin ?? country.tariff_per_min ?? 0;
    const included = marketTariff?.includedKm ?? country.included_km ?? 0;

    console.log(`📍 دولة ${country.name_ar} (ID: ${country.id}) [العملة: ${cur}]:`);
    console.log(`   - إجمالي الكباتن المسجلين: ${totalCaptains} | كباتن محددين للتسعيرة: ${pricedCaptains}`);
    console.log(`   - مصدر متوسط السوق الحالي: ${src} (النطاق: ${scope})`);
    console.log(`   - متوسط فتحة العداد:      ${base} ${cur}`);
    console.log(`   - متوسط سعر الكيلومتر:    ${km} ${cur}/كم`);
    console.log(`   - متوسط سعر الدقيقة:      ${min} ${cur}/دقيقة`);
    console.log(`   - المسافة المشمولة:       ${included} كم`);
    console.log('─'.repeat(72));
  });
}

async function main() {
  console.log('===================================================================');
  console.log('🚀 بدء فحص وتصفير متوسطات أسعار السوق (Reset Market Pricing)');
  console.log('===================================================================');
  if (IS_DRY_RUN) console.log('⚠️  وضع المعاينة الفاحصة مفعل (--dry-run) - لن يتم تعديل البيانات.');
  if (IS_CLEAN_REQUESTS) console.log('🧹 خيار تنظيف طلبات وعروض الركاب الاختبارية مفعل.');
  if (IS_SET_DEFAULTS) console.log('⚖️  خيار الضبط على التسعيرة الرسمية للدولة مفعل.');
  if (TARGET_COUNTRY_ID) console.log(`🎯 استهداف الدولة ذات المعرف: ${TARGET_COUNTRY_ID}`);

  // 1. Fetch countries
  let countriesQuery = supabase.from('countries').select('*').order('id', { ascending: true });
  if (TARGET_COUNTRY_ID) {
    countriesQuery = countriesQuery.eq('id', TARGET_COUNTRY_ID);
  }
  const { data: countries, error: countryErr } = await countriesQuery;

  if (countryErr || !countries || countries.length === 0) {
    console.error('❌ تعذر جلب بيانات الدول من جدول countries:', countryErr);
    process.exit(1);
  }

  // 2. Fetch state before
  const beforeState = await getMarketState(countries);
  printStateTable('الحالة الحالية لمتوسطات الأسعار (قبل التصفير)', beforeState);

  if (IS_DRY_RUN) {
    console.log('\n✅ انتهت المعاينة بنجاح. شغّل السكريبت بدون --dry-run لتنفيذ التصفير.');
    process.exit(0);
  }

  // 3. Perform Reset
  console.log('\n⚙️  جاري تنفيذ تصفير تسعيرات الكباتن...');

  for (const { country } of beforeState) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('country_id', country.id)
      .eq('role', 'CAPTAIN');

    const captainIds = (profiles || []).map(p => p.id);

    if (captainIds.length === 0) {
      console.log(`ℹ️  لا يوجد كباتن مسجلين لدولة ${country.name_ar}.`);
      continue;
    }

    if (IS_SET_DEFAULTS) {
      // Set to country defaults
      const { error: updateErr } = await supabase
        .from('captain_profiles')
        .update({
          base_fare: country.base_fare,
          price_per_km: country.per_km_rate,
          price_per_min: country.tariff_per_min ?? 0,
          included_km: country.included_km ?? 0,
          flag_fall_fee: country.base_fare,
        })
        .in('id', captainIds);

      if (updateErr) {
        console.error(`❌ خطأ أثناء ضبط تسعيرة دولة ${country.name_ar}:`, updateErr);
      } else {
        console.log(`✅ تم ضبط تسعيرة ${captainIds.length} كابتن في ${country.name_ar} على الحد الرسمي (${country.base_fare} فتحة عداد / ${country.per_km_rate} للكيلو).`);
      }
    } else {
      // Clear to NULL so market drops back cleanly to country_seed
      const { error: updateErr } = await supabase
        .from('captain_profiles')
        .update({
          base_fare: null,
          price_per_km: null,
          price_per_min: null,
          included_km: 0,
          flag_fall_fee: null,
        })
        .in('id', captainIds);

      if (updateErr) {
        console.error(`❌ خطأ أثناء تصفير تسعيرات دولة ${country.name_ar}:`, updateErr);
      } else {
        console.log(`✅ تم تصفير تسعيرة ${captainIds.length} كابتن في ${country.name_ar} بنجاح (عادت إلى NULL).`);
      }
    }
  }

  // 4. Optional: Clean test requests and offers
  if (IS_CLEAN_REQUESTS) {
    console.log('\n🧹 جاري تنظيف طلبات وعروض الركاب الاختبارية العالقة...');
    try {
      // Delete active offers first to satisfy foreign keys
      const { error: offErr } = await supabase
        .from('ride_offers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: reqErr } = await supabase
        .from('ride_requests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (offErr || reqErr) {
        console.warn('⚠️ ملاحظة عند تنظيف بعض السجلات:', offErr?.message || reqErr?.message);
      } else {
        console.log('✅ تم تنظيف جميع طلبات وعروض الركاب بنجاح.');
      }
    } catch (e) {
      console.warn('⚠️ تعذر إتمام مسح الطلبات تلقائياً:', e.message);
    }
  }

  // 5. Fetch state after and print
  const afterState = await getMarketState(countries);
  printStateTable('الحالة الجديدة لمتوسطات الأسعار (بعد التصفير والنظافة)', afterState);

  console.log('===================================================================');
  console.log('🎉 تم تصفير متوسطات الأسعار بنجاح تام وبدء السوق على نظافة 100%!');
  console.log('   أي كابتن أو راكب يفتح الرادار الآن سيجد الأسعار القانونية الرسمية.');
  console.log('===================================================================\n');
}

main().catch(err => {
  console.error('❌ خطأ غير متوقع:', err);
  process.exit(1);
});
