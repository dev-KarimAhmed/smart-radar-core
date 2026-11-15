export type TripStatus =
  | 'searching'
  | 'busy'
  | 'accepted'
  | 'arrived'
  | 'completed'
  | 'cancelled'
  | 'rating'
  | 'checkpoint_required'
  | 'archived'
  | 'in_progress'
  | 'idle';

export interface Trip {
  id: string;
  serial_id?: string;
  riderId: string;
  riderName?: string;
  riderPhone?: string;
  driverId?: string;
  status: TripStatus;
  offerPrice?: number;
  handshakeAt?: any;
  createdAt?: any;
  pickupCoords: { lat: number; lng: number };
  exactPickupCoords?: { lat: number; lng: number };
  obfuscatedPickupCoords?: { lat: number; lng: number };
  pickupLabel?: string;
  pickupGoogleMapsUrl?: string;
  pickupLocationIsApproximate?: boolean;
  h3Index?: string;
  gridId: string;
  isRatedByRider?: boolean;
  ratingSubmittedByDriver?: number;
  offers?: Offer[];
  district?: string;
  pricingPreference?: 'APP' | 'TAXI' | 'FREE' | null;
  auditLog?: string[];
  rejectedDrivers?: string[];
  riderNotification?: string;
  estimatedDistance?: number;
  dropoff?: string;
  dropoffCoords?: { lat: number; lng: number };
  estimatedTime?: number;
  estimatedDurationMinutes?: number;
  acceptedAtMs?: number;
  arrivedAtMs?: number;
  startedAtMs?: number;
  pickup_eta_minutes?: number;
  seats?: number;
  riderRating?: number;
  riderRatingCount?: number;
  riderCompletedTrips?: number;
  riderFavoritedMe?: boolean;
  cancel_requested_by?: 'rider' | 'captain' | null;
  cancel_request_time?: string | null;
}

export interface Offer {
  id?: string;
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
  tier?: string;
  distance_to_rider?: number;
  pickup_eta_minutes?: number;
  estimated_duration_minutes?: number;
  captain?: {
    id?: string;
    name?: string;
    full_name?: string;
    nickname?: string;
    phone?: string;
    avatar_url?: string;
    trust_rating?: number;
    tier?: string;
    vehicle_model?: string;
    vehicle_name?: string;
    vehicle_color?: string;
    plate_number?: string;
    license_plate?: string;
    serial_number?: string;
    serial?: string;
    bio?: string;
    notes?: string;
    [key: string]: any;
  } | null;
  wait_seconds?: number;
  created_at?: string;
  fare_breakdown?: Record<string, unknown> | null;
  pricing_mode?: 'FREE' | 'APP' | 'TAXI' | string;
  pricingMode?: 'FREE' | 'APP' | 'TAXI' | string;
}

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
