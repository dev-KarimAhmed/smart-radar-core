export interface SovereignAd {
  id: string;
  serial_id?: string;
  status: 'active' | 'paused' | 'archived' | 'ACTIVE' | 'PENDING' | 'REJECTED' | 'FROZEN' | string;
  title?: string;
  description?: string;
  posterUrl?: string; // إجباري لمسرح الشاشة الكامل
  whatsapp?: string; // إجباري للاستحواذ الصامت
  phone?: string; // إجباري للاستحواذ الصامت
  geoLoc?: string; // رابط خرائط جوجل إجباري
  targetGovernorate?: string; // السيادة الجغرافية
  targetDistrict?: string;
  targetImpressions?: number; // الظهور الحتمي بدل الوقت
  currentImpressions?: number;
  clicksCount?: number;
  isPremiumRetentionPaid?: boolean; // باقة التخليد الفاخرة للقبضة الخضراء
  expirationTimestamp?: number; // الطابع الزمني الرقمي لسقوط الأجل والتطهير التلقائي (72 ساعة للسحابة)
  isSovereignStopped?: boolean; // ختم الحوكمة
  rejectionReason?: string; // إفادة المدعي العام أو المشرف
  adType?: 'RIDER_BENEFIT' | 'CAPTAIN_PROFESSIONAL' | 'SOVEREIGN_NATIVE' | string;

  // Flat helper properties and metadata for compatibility
  createdAt?: string;
  type?: 'image' | 'video' | string;
  role?: 'all' | 'rider' | 'driver' | string;
  forDriver?: boolean; // public.ad_campaigns.for_driver — true routes the ad to captains
  geo?: {
    governorate?: string;
    district?: string;
  };
  content?: {
    title?: string;
    description?: string;
    posterUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    imageHint?: string;
  };
  action?: {
    buttonText?: string;
    actionUrl?: string;
  };
  endDate?: string;
  imageUrl?: string;
  imageHint?: string;
  actionUrl?: string;
  buttonText?: string;
}

export interface AdInput extends Partial<SovereignAd> {
  title: string;
  description: string;
  posterUrl: string;
  actionUrl: string;
  buttonText: string;
  role: 'driver' | 'rider' | 'all';
  targetImpressions: number;
  endDate: any;
  geo?: {
    governorate?: string;
    district?: string;
  };
  whatsapp?: string;
  phone?: string;
  geoLoc?: string;
  isPremiumRetentionPaid?: boolean;
  expirationTimestamp?: number;
  adType?: string;
}
