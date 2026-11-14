export interface CaptainProfileMetadata {
  vehicle_type: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_year: number | null;
  plate_number: string | null;
  employment_type: string | null;
  affiliation_type: string | null;
  office_phone: string | null;
  side_id: string | null;
  company_code?: string | null;
  nickname?: string | null;
  identity_url?: string | null;
  contact_page_url?: string | null;
  driving_license_url?: string | null;
  national_id_number?: string | null;
  license_number?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  verification_status: string;
}

export interface RiderSupabaseSignUpInput {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
  role?: 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE' | 'ADMIN';
  countryId: number;
  governorateId: number;
  districtId: number;
  rememberMe?: boolean;
  captainProfile?: CaptainProfileMetadata;
  lang?: 'ar' | 'en' | string;
}

export interface RiderSupabaseSignInInput {
  phone: string;
  password: string;
  rememberMe?: boolean;
  expectedRole?: 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE' | 'ADMIN';
  email?: string;
}

export interface RiderAuthMetadata {
  role: 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE' | 'ADMIN';
  full_name: string;
  phone: string;
  email?: string;
  country_id: number;
  currency_ar?: string;
  currency_en?: string;
  governorate_id: number;
  district_id: number;
  captain_profile?: CaptainProfileMetadata;
}
