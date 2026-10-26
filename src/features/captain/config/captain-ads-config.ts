/**
 * إعدادات وثوابت نظام إعلانات ومقاعد الكابتن الترويجية (Captain Ad Seats Config)
 * جميع أرقام التحقق والحدود محددة هنا كمتغيرات واضحة وسهلة التعديل
 */
export const CAPTAIN_ADS_CONFIG = {
  /** الحد الأقصى لعدد حروف نص الإعلان للكابتن */
  MAX_CAPTION_LENGTH: 100,

  /** الحد المبدئي لعرض نص الإعلان عند الراكب قبل زر "اعرض التفاصيل" */
  RIDER_CAPTION_PREVIEW_LIMIT: 45,

  /** مدة عرض كل إعلان في شريط التقدم (بالثواني) */
  STORY_DURATION_SECONDS: 6,

  /** لا يوجد حد أقصى لعدد إعلانات ومقاعد الكابتن */
  ALLOW_UNLIMITED_ADS: true,

  /** الحد الأقصى لحجم صورة الإعلان بالبايت (3 ميجابايت) */
  MAX_IMAGE_SIZE_BYTES: 3 * 1024 * 1024,

  /** أنواع ملفات الصور المسموح برفعها */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  /** سرعات حركة نهر الإعلانات بالثواني للدورة الواحدة */
  SPEED_DURATIONS: {
    slow: 95,   // قراءة متأنية وهادئة جداً
    normal: 60, // حركة متزنة ومريحة
    fast: 32,   // حركة سريعة ونشطة
  },

  /** نمط العرض الافتراضي ('river' | 'jump') */
  DEFAULT_DISPLAY_MODE: 'river' as const,

  /** السرعة الافتراضية للنهر ('slow' | 'normal' | 'fast') */
  DEFAULT_SPEED: 'normal' as const,

  /** مفاتيح التخزين المحلي */
  STORAGE_KEYS: {
    CAPTAIN_ADS_PREFIX: 'radar_captain_ads_',
    DISPLAY_MODE: 'sovereign_ad_display_mode',
    STREAM_SPEED: 'sovereign_ad_stream_speed',
    IS_PAUSED: 'sovereign_ad_is_paused',
    ACTIVE_LIGHTBOX_AD: 'sovereign_active_ad_lightbox',
  },

  /** أحداث الـ DOM المخصصة للتفاعل اللحظي دون إعادة تحميل الشاشة */
  CUSTOM_EVENTS: {
    DISPLAY_MODE_CHANGED: 'sovereign_ad_display_mode_changed',
    STREAM_SPEED_CHANGED: 'sovereign_ad_stream_speed_changed',
    PAUSE_CHANGED: 'sovereign_ad_pause_changed',
    ADS_UPDATED: 'radar_captain_ads_updated',
  },
} as const;

export type AdDisplayMode = 'river' | 'jump';
export type RiverSpeed = 'slow' | 'normal' | 'fast';
