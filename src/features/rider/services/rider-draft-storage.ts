export const RIDER_DRAFT_STORAGE_KEYS = [
  'radar_ride_request_draft',
  'radar_destination_draft',
  'radar_auction_draft',
  'radar_external_location_draft',
  'radar_request_flow',
  'radar_active_rider_machine_state',
  'radar_rider_trip_status',
  'radar_rider_passenger_count',
] as const;

export function clearRiderDraftStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    RIDER_DRAFT_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable in private browsing; in-memory state is still reset.
  }
}
