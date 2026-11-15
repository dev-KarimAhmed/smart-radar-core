export type UserRole = 'rider' | 'driver' | 'admin' | 'advertiser' | 'delegate';
export type AffiliationType = 'smart-app' | 'office-taxi' | 'independent';

export interface LastTripBuffer {
  driverId: string;
  driverName: string;
  driverPhone: string;
  expiresAt: any;
}

export interface User {
  uid: string;
  serial_id?: string;
  phone: string;
  role: UserRole;
  name: string;
  countryId?: number;
  currencyAr?: string;
  currencyEn?: string;
  governorate: string;
  district: string;
  status?: 'active' | 'idle' | 'busy' | 'rating';
  rating?: number;
  ratingSum?: number;
  ratingCount?: number;
  heartCount?: number;
  penaltyCount?: number;
  rank?: 'Platinum' | 'Gold' | 'Bronze' | 'Silver';
  adminRank?: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  allowedSectors?: string[];
  avatar?: string;
  fcmTokens?: string[];
  deviceId?: string;
  silencePreference?: 'silent' | 'chatty' | 'neutral';
  favoriteDrivers?: string[];
  isBufferActive?: boolean;
  lastTripBuffer?: LastTripBuffer;
  location?: { lat: number; lng: number };
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
