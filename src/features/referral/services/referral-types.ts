export interface LinkedCaptainInfo {
  is_linked: boolean;
  captain_id?: string;
  captain_name?: string;
  captain_phone?: string;
  captain_serial?: string;
  linked_at?: string;
  rating?: number;
  rating_count?: number;
}

export interface ReferredRiderInfo {
  rider_id: string;
  rider_name?: string;
  rider_phone?: string;
  rider_serial?: string;
  linked_at: string;
  last_interacted_at?: string;
  is_active?: boolean;
  days_inactive?: number;
  rating?: number;
  rating_count?: number;
}

export interface ClaimReferralResult {
  success: boolean;
  status?: 'newly_linked' | 'already_linked_to_this_captain';
  error?: 'captain_not_found' | 'cannot_refer_self' | 'already_linked_to_other_captain' | 'authentication_required' | 'missing_referral_ref' | string;
  captain_id?: string;
  captain_name?: string;
  captain_serial?: string;
  captain_phone?: string;
  existing_captain_id?: string;
  existing_captain_name?: string;
  existing_captain_serial?: string;
}
