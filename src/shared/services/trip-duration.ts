/**
 * One place for every "how long will this take" estimate.
 *
 * These were previously four different constants scattered across the rider and captain
 * screens — 2.2, 1.2, 1.5 min/km for the trip and 3 min/km for the pickup — so the same
 * trip could be shown as 15 minutes on one screen and 33 on another, and the fare was
 * computed from a fifth number again.
 *
 * All of these are FALLBACKS. When a real routed duration exists (OSRM, stored on the
 * request as estimated_duration_minutes) it must be preferred — see preferRoutedMinutes.
 */

/**
 * Fallback road speeds, km/h. Used only when no routed duration is available.
 *
 * A single flat figure (it was 2.2 min/km, i.e. 27.3 km/h) priced a motorway run and a
 * crawl through downtown identically. Offline there is no road-type data to consult, so the
 * only signal is distance: a short trip is almost certainly urban, a long one is mostly
 * intercity. The first URBAN_SEGMENT_KM are therefore costed at city speed and the rest at
 * highway speed.
 *
 * URBAN_SEGMENT_KM is a heuristic, not a measurement — 25 km is roughly a cross-Cairo trip.
 * Tune it if the two markets diverge. These three values are mirrored by
 * resolve_trip_metrics in supabase/migrations/20260826110000_road_type_fallback_speed.sql;
 * an estimated fare and an estimated display have to agree, so change both together.
 */
export const CITY_SPEED_KMH = 40;
export const HIGHWAY_SPEED_KMH = 100;
export const URBAN_SEGMENT_KM = 25;

/**
 * Minutes per km for the captain driving to the pickup, ~20 km/h. Slower than the trip
 * figure on purpose: the approach is short, urban, and ends with finding the rider.
 */
export const PICKUP_MINUTES_PER_KM = 3;

/**
 * Time-of-day multiplier on a free-flow duration.
 *
 * A single flat traffic factor per country cannot be right twice a day: measured against
 * Google on the same Giza route, the app was ~20% optimistic at 08:00 and roughly correct at
 * 14:00. One number split the difference and was wrong in both directions.
 *
 * The shape is the ordinary two-peak commute curve — a morning peak, a shallower midday, a
 * heavier and longer evening peak, and near free-flow overnight. Friday is the weekend in
 * Egypt and Jordan, so its morning peak is absent.
 *
 * These are STARTING values, not measurements. recalibrate_traffic_factors() in
 * supabase/migrations/20260903090000_trip_duration_calibration.sql measures the real
 * multiplier from completed trips and corrects the per-country factor this sits on top of;
 * this curve only has to get the SHAPE of the day roughly right.
 */
const HOURLY_TRAFFIC_CURVE = [
  0.85, 0.85, 0.85, 0.85, 0.90, 1.00, // 00-05  empty roads
  1.15, 1.35, 1.45, 1.35, 1.15, 1.10, // 06-11  morning peak, 08:00 worst
  1.10, 1.15, 1.15, 1.25, 1.40, 1.50, // 12-17  build to the evening peak
  1.45, 1.30, 1.15, 1.05, 0.95, 0.90, // 18-23  evening tail
] as const;

export const WEEKEND_MORNING_RELIEF = 0.85;

export function timeOfDayTrafficMultiplier(when: Date = new Date()) {
  const hour = when.getHours();
  const base = HOURLY_TRAFFIC_CURVE[hour] ?? 1;

  // Friday (5) is the weekend here; there is no commute to be stuck in before noon.
  const isWeekendMorning = when.getDay() === 5 && hour < 12;
  return isWeekendMorning ? Math.max(1, base * WEEKEND_MORNING_RELIEF) : base;
}

const MIN_TRIP_MINUTES = 3;
const MIN_PICKUP_MINUTES = 1;

/** Fallback trip duration for a distance in km. Use only when no routed duration exists. */
export function estimateTripMinutes(distanceKm: number | null | undefined) {
  const km = Number(distanceKm);
  if (!Number.isFinite(km) || km <= 0) return MIN_TRIP_MINUTES;

  const urbanKm = Math.min(km, URBAN_SEGMENT_KM);
  const highwayKm = Math.max(0, km - URBAN_SEGMENT_KM);
  const minutes = (urbanKm / CITY_SPEED_KMH) * 60 + (highwayKm / HIGHWAY_SPEED_KMH) * 60;

  return Math.max(MIN_TRIP_MINUTES, Math.round(minutes));
}

/** Fallback pickup ETA for a distance in km. */
export function estimatePickupMinutes(distanceKm: number | null | undefined) {
  const km = Number(distanceKm);
  if (!Number.isFinite(km) || km <= 0) return MIN_PICKUP_MINUTES;
  return Math.max(MIN_PICKUP_MINUTES, Math.round(km * PICKUP_MINUTES_PER_KM));
}

/**
 * The routed duration when there is one, the estimate otherwise. Every screen showing a
 * trip duration should go through this so the rider is never quoted one number and charged
 * against another.
 */
export function preferRoutedMinutes(
  routedMinutes: number | null | undefined,
  distanceKm: number | null | undefined,
) {
  const routed = Number(routedMinutes);
  if (Number.isFinite(routed) && routed > 0) return Math.round(routed);
  return estimateTripMinutes(distanceKm);
}
