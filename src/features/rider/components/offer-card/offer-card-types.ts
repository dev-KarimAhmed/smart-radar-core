export type CaptainRank = 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'BRONZE' | 'SILVER';

export interface CaptainProfile {
  id: string;
  name: string;
  avatar_url?: string;
  trust_rating: number;
  rank: CaptainRank;
  vehicle_model: string;
  vehicle_color: string;
  plate_number: string;
  completed_trips?: number;
  company_name?: string | null;
  affiliation_label?: string;
  affiliation_type?: string;
  is_verified?: boolean;
  phone?: string;
  contact_url?: string;
  vehicle_year?: string | number;
  vehicle_category?: string;
  facebook_url?: string;
  instagram_url?: string;
  serial_number?: string | number;
  whatsapp_url?: string;
}

export interface OfferFareBreakdown {
  baseFare?: number;
  perKm?: number;
  perMin?: number;
  includedKm?: number;
  roadKm?: number;
  billableKm?: number;
  minutes?: number;
  kmCharge?: number;
  minCharge?: number;
  meterFare?: number;
  marketFare?: number | null;
  floorPrice?: number | null;
  ceilingPrice?: number | null;
  tier?: string;
  adjustment?: number;
  offeredFare?: number;
  minTripFare?: number | null;
  tariffMissing?: boolean;
}

export interface CaptainOffer {
  id: string;
  captain: CaptainProfile;
  server_fare: number;
  submitted_fare?: number;
  pricing_mode?: 'FREE' | 'APP' | 'TAXI';
  eta_minutes: number;
  distance_km: number;
  estimated_duration_minutes?: number;
  trip_distance_km?: number;
  destination_label?: string;
  additional_info?: string;
  wait_seconds?: number;
  created_at?: string;
  fare_breakdown?: OfferFareBreakdown | null;
}

export interface CaptainOfferCardCountdown {
  hasCountdown: boolean;
  remainingSeconds: number;
  percentRemaining: number;
  isExpired: boolean;
}

export const premiumFactors: Record<CaptainRank, number> = {
  DIAMOND: 0.25,
  PLATINUM: 0.2,
  GOLD: 0.15,
  BRONZE: 0.15,
  SILVER: 0.15,
};

export const rankLabels: Record<'ar' | 'en', Record<CaptainRank, string>> = {
  ar: {
    DIAMOND: 'ماسي',
    PLATINUM: 'بلاتيني',
    GOLD: 'ذهبي',
    BRONZE: 'برونزي',
    SILVER: 'فضي',
  },
  en: {
    DIAMOND: 'Diamond',
    PLATINUM: 'Platinum',
    GOLD: 'Gold',
    BRONZE: 'Bronze',
    SILVER: 'Silver',
  },
};
