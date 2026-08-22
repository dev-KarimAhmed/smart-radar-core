/**
 * [SCR-CMD-101] مصدر الحقيقة الوحيد للثوابت السيادية (SSOT)
 * يُمنع منعاً باتاً كتابة أي من هذه القيم يدوياً في أي ملف آخر.
 */
export const SOVEREIGN_CONSTANTS = {
  // 1. الثوابت الجغرافية (Geo-Constraints)
  RADAR_RADIUS_KM: 1.5,             // القطر السيادي للبحث
  URBAN_DETOUR_INDEX: 1.35,         // معامل التعرج لتعويض خرائط جوجل محلياً
  PULSE_SECTOR_SIZE: 1.5,           // The size of the market pulse sectors in kilometers.

  // 2. ثوابت المصافحة والتدوير (Rotation & Lifecycle)
  ROTATION_CYCLE_DURATION_MS: 250 * 1000, // المقصلة الزمنية
  ROTATION_MAX_ITERATIONS: 2,         // Allows for 3 total cycles
  REQUEST_COOL_DOWN_MS: 10000,        // 10 seconds anti-spam for new ride requests.
  TRIP_CHECKPOINT_DELAY_MIN: 10,      // 10 minutes before a trip is flagged for checkpoint.
  TRIP_ARCHIVE_PURGE_HOURS: 150,      // Purge archived trips older than this
  TRIP_FORGOTTEN_GRACE_MIN: 30,     // Grace period for auto-terminating forgotten trips
  SOVEREIGN_TRIP_AUTO_COMPLETE_DURATION_MIN: 120, // Sovereign fixed time to auto-complete a busy trip (in minutes)

  // 3. ثوابت الحصة (Quota)
  QUOTA_MAX_DRIVERS_VISIBLE: 12,      // 9 أساسي + 3 احتياط
  QUOTA_MAX_RIDERS_VISIBLE: 9,        // الحد الأقصى للسائقين الظاهرين للراكب
  RADAR_SCAN_LIMIT: 50,             // Max trips/drivers to query in a single go

  // 4. ثوابت النبض الاقتصادي (V-Pulse Speeds & Simulation)
  PULSE_SPEED_CRITICAL: 15,         // السرعة في الأزمات الخانقة (كم/س)
  PULSE_SPEED_ACTIVE: 25,           // السرعة في الحركة النشطة (كم/س)
  PULSE_SPEED_STABLE: 40,           // السرعة في الشوارع السالكة (كم/س)
  SIMULATION_KM: 5,                 // Distance for benchmark simulation
  SIMULATION_MIN: 10,                // Duration for benchmark simulation
  FUEL_CONSUMPTION_FACTOR: 0.12,    // Fuel consumption L/km for benchmark
  PRICE_DUMPING_THRESHOLD_PERCENT: 15, // Max allowed undercut percentage

  // 5. ثوابت التشغيل (Operational)
  DORMANCY_WARNING_MS: 4 * 60 * 1000,  // 4 minutes until a dormancy warning
  DORMANCY_TIMEOUT_MS: 5 * 60 * 1000,   // 5 minutes of inactivity until status is set to 'idle'
  MIN_TRIP_DURATION_MIN: 3,           // الحد الأدنى المحتسب لأي رحلة
  
  // 6. ثوابت الرتب (Ranking) — نُقلت بالكامل إلى Postgres.
  // The single source of truth is now public.calculate_sovereign_rank(), installed by
  // supabase/migrations/20260822090000_captain_rank_sovereign_engine.sql.
  // Do not reintroduce the thresholds here — two copies is how they drifted last time.

} as const;
