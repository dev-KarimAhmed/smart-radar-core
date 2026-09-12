import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';
import { latLngToCell } from 'h3-js';

const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const index = args.indexOf(name);
  if (index !== -1 && args[index + 1]) return args[index + 1];
  return defaultValue;
}

const CENTER_LAT = parseFloat(getArg('--lat', '29.9316785'));
const CENTER_LNG = parseFloat(getArg('--lng', '30.9187774'));
const COUNTRY_ID = parseInt(getArg('--country', '2'), 10);
const IS_ONCE = args.includes('--once');
const HEARTBEAT_INTERVAL_MS = 15000;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ خطأ: لم يتم العثور على NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY في ملف .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log('====================================================');
  console.log('🚀 بدء تشغيل سكريبت بث 10 كباتن نشطين للتجربة');
  console.log('====================================================');
  console.log(`📍 مركز الإحداثيات: Lat: ${CENTER_LAT}, Lng: ${CENTER_LNG}`);
  const centerH3 = latLngToCell(CENTER_LAT, CENTER_LNG, 9);
  console.log(`🔷 خلية H3 المركزية (دقة 9): ${centerH3}`);
  console.log(`🇪🇬 معرف الدولة (Country ID): ${COUNTRY_ID}`);

  const { data: captains, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, role, status')
    .eq('role', 'CAPTAIN')
    .limit(10);

  if (profileErr) {
    console.error('❌ خطأ في جلب بيانات الكباتن:', profileErr);
    process.exit(1);
  }

  if (!captains || captains.length < 10) {
    console.warn(`⚠️ تحذير: تم العثور على ${captains?.length || 0} كباتن فقط من أصل 10.`);
  }

  const selectedCaptains = captains.slice(0, 10);
  console.log(`✅ تم اختيار ${selectedCaptains.length} كباتن من قاعدة البيانات:`);
  selectedCaptains.forEach((c, idx) => {
    console.log(`   ${idx + 1}. ${c.full_name || 'كابتن'} (${c.id})`);
  });

  const captainIds = selectedCaptains.map(c => c.id);
  await supabase
    .from('profiles')
    .update({ status: 'ACTIVE' })
    .in('id', captainIds);

  async function pulseCaptains() {
    const nowIso = new Date().toISOString();
    const records = selectedCaptains.map((cap, i) => {
      const angle = (i * 2 * Math.PI) / selectedCaptains.length;
      const distanceKm = 0.2 + (i % 4) * 0.15;
      const latOffset = (distanceKm * Math.sin(angle)) / 111.0;
      const lngOffset = (distanceKm * Math.cos(angle)) / (111.0 * Math.cos((CENTER_LAT * Math.PI) / 180));

      const lat = Number((CENTER_LAT + latOffset).toFixed(7));
      const lng = Number((CENTER_LNG + lngOffset).toFixed(7));
      const cell = latLngToCell(lat, lng, 9);

      return {
        captain_id: cap.id,
        location_lat: lat,
        location_lng: lng,
        h3_cell: cell,
        is_available: true,
        country_id: COUNTRY_ID,
        updated_at: nowIso,
      };
    });

    const { error: upsertErr } = await supabase
      .from('captain_locations')
      .upsert(records, { onConflict: 'captain_id' });

    if (upsertErr) {
      console.error('❌ خطأ أثناء تحديث مواقع الكباتن:', upsertErr);
    } else {
      const timeStr = new Date().toLocaleTimeString('ar-EG');
      console.log(`[${timeStr}] 💓 تم تجديد نبض ${records.length} كباتن بنجاح (متاحين + داخل نطاق H3).`);
      console.log(`👉 الآن افتح شاشة الراكب: يجب أن يظهر لك في الرادار والعداد 9 كباتن فقط كحد أقصى (تطبيق الحصة السوقية 9).`);
    }
  }

  await pulseCaptains();

  if (IS_ONCE) {
    console.log('ℹ️ تم الانتهاء بنمط المرة الواحدة (--once). ستنتهي صلاحية الكباتن بعد 60 ثانية تلقائياً.');
    process.exit(0);
  }

  console.log('----------------------------------------------------');
  console.log(`⏳ السكريبت مستمر في إرسال النبض كل ${HEARTBEAT_INTERVAL_MS / 1000} ثانية لإبقاء الكباتن متاحين.`);
  console.log('🛑 لإيقاف السكريبت في أي وقت اضغط Ctrl + C');
  console.log('----------------------------------------------------');

  const interval = setInterval(pulseCaptains, HEARTBEAT_INTERVAL_MS);

  const cleanup = () => {
    clearInterval(interval);
    console.log('\n🛑 تم إيقاف بث الكباتن.');
    console.log('⏳ ستختفي الكباتن من رادار الراكب تلقائياً بعد 60 ثانية بفضل مهلة الصلاحية (TTL).');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error('💥 حدث خطأ غير متوقع:', err);
  process.exit(1);
});
