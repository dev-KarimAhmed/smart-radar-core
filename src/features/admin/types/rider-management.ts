export interface RiderUser {
  id: string;
  serial_id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'IDLE' | 'BUSY' | 'SUSPENDED' | 'BANNED';
  tier: string;
  rating: number;
  trust_score: number;
  consecutive_cancellations: number;
  completed_trips_count?: number;
  country_id?: number;
  country_name?: string;
  governorate_id?: number;
  district_id?: number;
  governorate: string;
  district: string;
  created_at: string;
  updated_at: string;
  wallet: {
    balance: number;
    currency_code: string;
  };
  referral_activity?: {
    has_referral: boolean;
    referral_id?: string | null;
    captain_id?: string | null;
    captain_name?: string | null;
    captain_phone?: string | null;
    captain_serial?: string | null;
    last_interacted_at?: string;
    days_inactive?: number;
    is_active?: boolean;
    last_notified_at?: string | null;
  };
}

export interface RiderStats {
  total: number;
  online: number;
  idle: number;
  suspended: number;
  atRisk: number;
  completedTrips: number;
}

export type RiderMessageType = 'info' | 'admin_message' | 'warning' | 'urgent';
export type RiderBulkScope = 'all' | 'selected' | 'filtered';

