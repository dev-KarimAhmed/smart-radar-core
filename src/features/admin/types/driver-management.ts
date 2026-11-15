export interface CaptainUser {
  id: string;
  serial_id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'IDLE' | 'BUSY' | 'SUSPENDED' | 'BANNED';
  tier: 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'BRONZE' | 'SILVER';
  rating: number;
  rating_count: number;
  heart_count: number;
  penalty_count: number;
  trust_score: number;
  country_id?: number;
  country_name?: string;
  governorate_id?: number;
  district_id?: number;
  governorate: string;
  district: string;
  preferred_language?: string;
  created_at: string;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    color: string;
    plate: string;
    type: string;
    affiliation_type: string;
    office_phone: string;
    side_id: string;
  };
  verification_status: 'APPROVED' | 'PENDING' | 'REJECTED';
  documents: {
    identity_url: string | null;
    driving_license_url: string | null;
    vehicle_registration_url: string | null;
    criminal_record_url: string | null;
  };
  wallet: {
    balance: number;
    paid_minutes_remaining: number;
    bonus_minutes_remaining: number;
    total_minutes: number;
    active_package_name: string | null;
    time_bundle_expires_at: string | null;
    currency_code: string;
    currency_ar?: string;
  };
  currency?: string;
}

export const getCaptainCurrency = (cap?: CaptainUser | null, isArabic = true): string => {
  if (!cap) return isArabic ? 'د.أ' : 'JOD';
  const isEgypt = cap.wallet?.currency_code === 'EGP' || cap.phone?.startsWith('+20');
  if (isEgypt) return isArabic ? 'ج.م' : 'EGP';
  return isArabic ? 'د.أ' : 'JOD';
};

export interface WelcomeHoursConfig {
  enabled: boolean;
  hours: number;
  minutes: number;
  validityDays: number;
}

export type BulkScope = 'all' | 'selected' | 'filtered';

