export interface RoadRoutePoint {
  lat: number;
  lng: number;
}

export const ROUTE_PROVIDERS = ['mapbox', 'valhalla', 'osrm'] as const;
export type RouteProvider = (typeof ROUTE_PROVIDERS)[number];

export interface RoadRouteEstimate {
  distanceKm: number;
  durationMinutes: number;
  isFallback: boolean;
  /**
   * Which engine produced this, and between which two points.
   */
  source?: RouteProvider | 'haversine-fallback';
  origin?: RoadRoutePoint;
  destination?: RoadRoutePoint;
}

export interface RawRoute {
  distanceKm: number;
  minutes: number;
  /**
   * Whether the engine's duration already accounts for real-world slowdown.
   */
  modelsCongestion: boolean;
}

export const DEFAULT_MAPBOX_URL = 'https://api.mapbox.com';
export const DEFAULT_VALHALLA_URL = 'https://valhalla1.openstreetmap.de';
export const DEFAULT_OSRM_URL = 'https://router.project-osrm.org';

/**
 * Mapbox and OSM routers compute physical street distances along road networks.
 * Kept neutral at 1.0 so that accurate road networks remain true without artificial distortion.
 */
export const OSM_ROAD_CALIBRATION_FACTOR = 1.0;

/**
 * Sovereign Constitution V2.6-Secured (Chapter 2, Section 4):
 * OSRM routing timeout is capped at 1500ms hard ceiling. If the server does not respond
 * within 1500ms, the system immediately activates edge Haversine x 1.3 fallback.
 */
export const ROUTE_TIMEOUT_MS = 1500;
export const ROUTE_FETCH_ATTEMPTS = 2;
export const PRIMARY_TIMEOUT_MS = 1500;

export const PROVIDER_FAILURE_LIMIT = 2;
export const PROVIDER_COOLDOWN_MS = 120_000;

export const ROUTE_CACHE_LIMIT = 200;

export const FALLBACK_TORTUOSITY_FACTOR = 1.3;
export const DEFAULT_TRAFFIC_FACTOR = 1.25;
export const MIN_TRAFFIC_FACTOR = 1;
export const MAX_TRAFFIC_FACTOR = 3;

export const MIN_TORTUOSITY_FACTOR = 1.15;
export const MAX_TORTUOSITY_FACTOR = 1.35;
export const MAX_ROUTE_DISTANCE_KM = 40000;
export const MAX_ROUTE_TO_STRAIGHT_DISTANCE_RATIO = 4;
