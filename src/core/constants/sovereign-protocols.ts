/**
 * [SCR-CMD-101] معايير الضوابط السيادية لنظام الطاقية (SSOT)
 * ينظم معايير الملاحة والعمليات الحيوية للبيئة السحابية والبرمجية المعززة لمسار الرحلات.
 */
export const SOVEREIGN_CONSTANTS = {
  // 1. الثوابت الجغرافية (Geo-Constraints)
  RADAR_RADIUS_KM: 1.5,             // نصف قطر الدوران الفعال للرحلات
  URBAN_DETOUR_INDEX: 1.35,         // معدل الاستدارة الميداني المحاكي لكثافة الشوارع
  PULSE_SECTOR_SIZE: 1.5,           // The size of the market pulse sectors in kilometers.

  // 2. معايير الفترات الزمنية والدورية (Rotation & Lifecycle)
  ROTATION_CYCLE_DURATION_MS: 250 * 1000, // المدة الزمنية لدورة البحث النشط
  ROTATION_MAX_ITERATIONS: 2,         // Allows for 3 total cycles
  REQUEST_COOL_DOWN_MS: 10000,        // 10 seconds anti-spam for new ride requests.
  TRIP_CHECKPOINT_DELAY_MIN: 10,      // 10 minutes before a trip is flagged for checkpoint.
  TRIP_ARCHIVE_PURGE_HOURS: 150,      // Purge archived trips older than this
  TRIP_FORGOTTEN_GRACE_MIN: 30,     // Grace period for auto-terminating forgotten trips
  TRIP_LIFESPAN_EXTENSION_MIN: 30,    // Minutes to add when extending a trip's lifespan

  // 3. معايير الحصص والحدود (Quota)
  QUOTA_MAX_DRIVERS_VISIBLE: 12,      // 9 فرسان نشيطين + 3 في الاستماع
  QUOTA_MAX_RIDERS_VISIBLE: 9,        // الأقصى للفرسان المرئيين للفرسان النشيطين
  RADAR_SCAN_LIMIT: 50,             // Max trips/drivers to query in a single go

  // 4. معايير السرعات والمحاكاة لسرعة النبض (V-Pulse Speeds & Simulation)
  PULSE_SPEED_CRITICAL: 15,         // السرعة الحرجة للنبض الميداني (كم/س)
  PULSE_SPEED_ACTIVE: 25,           // السرعة النشطة للنبض الميداني (كم/س)
  PULSE_SPEED_STABLE: 40,           // السرعة المستقرة للنبض الميداني (كم/س)
  SIMULATION_KM: 5,                 // Distance for benchmark simulation
  SIMULATION_MIN: 10,                // Duration for benchmark simulation
  FUEL_CONSUMPTION_FACTOR: 0.12,    // Fuel consumption L/km for benchmark
  PRICE_DUMPING_THRESHOLD_PERCENT: 15, // Max allowed undercut percentage

  // 5. معايير النشاط والخماد (Operational)
  DORMANCY_WARNING_MS: 9 * 60 * 1000,  // 9 minutes until a dormancy warning
  DORMANCY_TIMEOUT_MS: 10 * 60 * 1000,   // 10 minutes of inactivity until status is set to 'idle'
  MIN_TRIP_DURATION_MIN: 3,           // الأدنى المعتمد للرحلات كأمان

  // 6. ثوابت الرتب والتصنيفات (Ranking)
  RANKING_RULES: {
    PLATINUM: { minRating: 4.8, minHearts: 50, name: 'Platinum' },
    GOLD: { minRating: 4.5, minHearts: 20, name: 'Gold' },
    SILVER: { minRating: 4.0, minHearts: 0, name: 'Silver' },
    BRONZE: { minRating: 0, minHearts: 0, name: 'Bronze' }
  },
} as const;
export type SovereignConstantsType = typeof SOVEREIGN_CONSTANTS;
