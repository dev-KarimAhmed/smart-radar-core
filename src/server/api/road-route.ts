import { Router } from 'express';

import {
  fetchRoadRoute,
  MAX_ROUTE_DISTANCE_KM,
  normalizeTortuosityFactor,
  normalizeTrafficFactor,
} from '../../lib/road-route';

/**
 * Server-side routing.
 *
 * Two reasons this exists:
 *
 * 1. RESCUE. The rider's browser reaches valhalla1.openstreetmap.de and
 *    router.project-osrm.org directly, which is the right default — it spreads load across
 *    users instead of concentrating it on one IP against a community fair-use server. But
 *    ad-blockers, corporate DNS and captive networks all break those direct calls, and the
 *    trip then falls to a straight-line guess. The server has clean network access, so it
 *    can answer when the browser cannot.
 *
 * 2. AUTHORITY. resolve_trip_metrics in Postgres cannot make a network call. When the client
 *    supplies no metrics, the fare falls back to `haversine * factor` at 40/100 km/h — the
 *    exact model that mispriced trips before. This endpoint gives the server a way to obtain
 *    real road metrics for itself rather than trusting or guessing.
 *
 * Deliberately reuses fetchRoadRoute rather than re-implementing the provider chain: the
 * whole point of that module is that the rider's displayed distance, the stored distance and
 * the fare are computed from ONE source. A second implementation here would be a second
 * source, which is the class of bug this endpoint is meant to help close.
 */
export const roadRouteRouter = Router();

/** A point that cannot be a location at all. Not a range check on the trip — see below. */
function isUsablePoint(value: unknown): value is { lat: number; lng: number } {
  if (!value || typeof value !== 'object') return false;
  const lat = Number((value as { lat?: unknown }).lat);
  const lng = Number((value as { lng?: unknown }).lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  // 0,0 is in the Gulf of Guinea. In practice it is always an unset field, never a fare.
  return !(lat === 0 && lng === 0);
}

roadRouteRouter.post('/road-route', async (req, res) => {
  const { origin, destination, tortuosityFactor, trafficFactor } = req.body ?? {};

  if (!isUsablePoint(origin) || !isUsablePoint(destination)) {
    return res.status(400).json({ error: 'invalid_coordinates' });
  }

  // The URLs are built from a fixed provider list inside fetchRoadRoute and never from the
  // request, so there is no SSRF surface here — only the coordinates are caller-supplied,
  // and they are bounded above.
  try {
    const estimate = await fetchRoadRoute(
      origin,
      destination,
      normalizeTortuosityFactor(Number(tortuosityFactor)),
      normalizeTrafficFactor(Number(trafficFactor)),
    );

    if (estimate.distanceKm > MAX_ROUTE_DISTANCE_KM) {
      return res.status(422).json({ error: 'route_too_long' });
    }

    return res.json(estimate);
  } catch (error: unknown) {
    console.error('[road-route]', error);
    return res.status(502).json({ error: 'routing_failed' });
  }
});
