import type { RiderLocation } from '../components/rider-map';

export type SupabaseRpcLike = {
  rpc: (name: string, args: Record<string, number>) => PromiseLike<{ data: unknown; error: unknown }>;
};

export type SupabaseMarketplaceRpcLike = {
  rpc: (name: string, args: Record<string, string | number>) => PromiseLike<{ data: unknown; error: unknown }>;
};

export type SupabaseInsertLike = {
  from: (table: string) => {
    insert: (payload: RideRequestInsertPayload) => {
      select: (columns: string) => {
        single: () => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
};

export type SupabaseFromLike = {
  from: (table: string) => any;
  rpc?: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }> | any;
};

export type SupabaseRealtimeLike = {
  channel: (name: string) => {
    on: (
      type: 'postgres_changes',
      filter: {
        event: 'UPDATE' | 'INSERT' | 'DELETE' | '*';
        schema: 'public';
        table: string;
        filter: string;
      },
      callback: (payload: any) => void,
    ) => {
      subscribe: (callback?: (status: string, error?: unknown) => void) => unknown;
    };
    unsubscribe?: () => Promise<unknown> | unknown;
  };
};

export interface ServerFareInput {
  origin: RiderLocation;
  destination: RiderLocation;
  countryId: number;
  roadKm?: number | null;
  durationMinutes?: number | null;
}

export interface RideRequestInsertInput {
  riderId: string;
  origin: RiderLocation;
  pickupAddress?: string;
  pickupGoogleMapsUrl?: string;
  destination: RiderLocation;
  originH3: string;
  destinationH3: string;
  destinationAddressAr: string;
  serverEstimatedFare: number;
  routeDistanceKm?: number;
  routeDurationMinutes?: number;
  countryId: number;
  pricingPreference?: 'FREE' | 'APP' | 'TAXI' | null;
  numberOfRiders?: number;
}

export interface RideRequestInsertPayload {
  rider_id: string;
  origin_lat: number;
  origin_lng: number;
  origin_address: string | null;
  origin_google_maps_url: string;
  estimated_distance_km: number | null;
  estimated_duration_minutes: number | null;
  destination_lat: number;
  destination_lng: number;
  origin_h3: string;
  destination_h3: string;
  destination_address_ar: string;
  server_estimated_fare: number;
  country_id: number;
  status: 'PENDING';
  pricing_preference?: 'FREE' | 'APP' | 'TAXI' | null;
  number_of_riders?: number;
}

export interface RideRequestRow {
  id: string;
  status: string;
  server_estimated_fare?: number;
}

export interface CaptainPresencePoint {
  id: string;
  serial: string;
  h3Cell: string;
  coordinates: RiderLocation;
  updatedAt: string | null;
  etaMinutes?: number;
  rank?: string;
}

export interface CaptainPresenceQueryInput {
  centerH3Cell: string;
  countryId?: number | null;
  nowMs?: number;
  ringSize?: number;
  ttlMs?: number;
}
