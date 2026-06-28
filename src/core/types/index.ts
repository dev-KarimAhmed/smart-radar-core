export type UserRole = 'rider' | 'driver' | 'admin' | 'advertiser' | 'delegate';
export type AffiliationType = 'smart-app' | 'office-taxi';

export interface LastTripBuffer {
  driverId: string;
  driverName: string;
  driverPhone: string;
  expiresAt: any; 
}

export interface User {
  uid: string;
  phone: string;
  role: UserRole;
  name: string;
  governorate: string; 
  district: string;    
  status?: 'active' | 'idle' | 'busy' | 'rating';
  rating?: number;
  ratingSum?: number;
  ratingCount?: number;
  heartCount?: number;
  penaltyCount?: number; 
  rank?: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  avatar?: string;
  fcmTokens?: string[];
  deviceId?: string;
  silencePreference?: 'silent' | 'chatty' | 'neutral';
  favoriteDrivers?: string[];
  isBufferActive?: boolean;
  lastTripBuffer?: LastTripBuffer;
  location?: { lat: number, lng: number };
  isRatingRequired?: boolean;
  gridId?: string;
  isOperatorLinked?: boolean;
  consecutiveCancellations?: number;
  companyName?: string;
  commercialRegister?: string;
  adLicense?: string;
  businessType?: string;
  affiliation?: {
      type: string;
      name: string;
      phone?: string;
  };
  vehicle?: {
      year: number;
      plate: string;
      make?: string;
      color?: string;
      sideId?: string;
  };
  pricing?: {
    baseFare: number;
    perKm: number;
    perMin: number;
  };
  subscriptionHours?: number;
  walletBalanceJD?: number;
  activePackageName?: string;
  walletTransactions?: any[];
  paidHoursRemaining?: number;
  bonusHoursRemaining?: number;
  lastTickTimestamp?: number;
  referralCode?: string;
  referredCount?: number;
  pendingDues?: number;
  subRole?: 'independent' | 'captain';
  isFleetActive?: boolean;
}

export type TripStatus = 'searching' | 'busy' | 'completed' | 'cancelled' | 'rating' | 'checkpoint_required' | 'archived' | 'in_progress' | 'idle';

export interface Trip {
  id: string;
  riderId: string;
  driverId?: string;
  status: TripStatus;
  offerPrice?: number;
  handshakeAt?: any;
  createdAt?: any;
  pickupCoords: { lat: number; lng: number; };
  exactPickupCoords?: { lat: number; lng: number; };
  obfuscatedPickupCoords?: { lat: number; lng: number; };
  h3Index?: string;
  gridId: string;
  isRatedByRider?: boolean;
  ratingSubmittedByDriver?: number;
  offers?: Offer[];
  district?: string;
  requiresOfficialRate?: boolean;
  auditLog?: string[];
  rejectedDrivers?: string[];
  riderNotification?: string; 
  estimatedDistance?: number;
  dropoff?: string;
  estimatedTime?: number;
  seats?: number;
}

export interface Offer {
    driverId: string;
    price: number;
    driverName: string;
    driverRating: number;
    driverRank: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
    driverVehicle: any;
    silencePreference?: 'silent' | 'chatty' | 'neutral';
    driverAvatar?: string;
    driverAffiliation?: {
      type: string;
      name: string;
      phone?: string;
    };
    isDumping?: boolean;
    displayTarget?: 'basic_9' | 'reserve_3' | 'hidden';
}

export interface SovereignAd {
  id: string;
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

export interface MarketPulse {
  id: string;
  trend: 'high_demand' | 'high_supply' | 'balanced' | string;
  demand: number;
  supply: number;
  priceAnomaliesCount?: number; // عدد حالات الشذوذ السعري / حرق الأسعار المرصودة
  priceAnomalyTrend?: 'up' | 'down' | 'stable'; // اتجاه الشذوذ الإعلاني السعري
  emergencyAdCapacityActive?: boolean; // تفعيل السعة الطارئة والمكثفة
}

export type RegistrationPayload = any;

export interface VehicleOfferData {
  ratingCount?: number;
  cleanlinessSum?: number;
  quietnessSum?: number;
  adherenceSum?: number;
  ratingSum?: number;
  plate?: string;
  year?: number;
  make?: string;
  color?: string;
  sideId?: string;
}
