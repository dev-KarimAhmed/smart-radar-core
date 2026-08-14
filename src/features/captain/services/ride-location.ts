export function isValidCoordinatePair(lat: number | null, lng: number | null) {
  return (
    lat !== null &&
    lng !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    (lat !== 0 || lng !== 0)
  );
}

export function normalizeExternalMapUrl(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

    const isGoogleMapsHost =
      url.hostname === 'google.com' ||
      url.hostname.endsWith('.google.com') ||
      url.hostname === 'goo.gl' ||
      url.hostname.endsWith('.goo.gl');

    if (isGoogleMapsHost) {
      const coordinateQuery = url.searchParams.get('query') || url.searchParams.get('q');
      if (coordinateQuery && /(^|[^\d-])0(?:\.0+)?\s*[, ]\s*0(?:\.0+)?([^\d]|$)/.test(coordinateQuery)) {
        return null;
      }
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function buildGoogleMapsUrl(lat: number | null, lng: number | null) {
  if (!isValidCoordinatePair(lat, lng)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function estimateHaversineDistanceKm(
  originLat: number | null,
  originLng: number | null,
  destinationLat: number | null,
  destinationLng: number | null,
) {
  if (!isValidCoordinatePair(originLat, originLng) || !isValidCoordinatePair(destinationLat, destinationLng)) {
    return null;
  }

  const safeOriginLat = originLat as number;
  const safeOriginLng = originLng as number;
  const safeDestinationLat = destinationLat as number;
  const safeDestinationLng = destinationLng as number;
  const radiusKm = 6371;
  const dLat = degreesToRadians(safeDestinationLat - safeOriginLat);
  const dLng = degreesToRadians(safeDestinationLng - safeOriginLng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(degreesToRadians(safeOriginLat))
      * Math.cos(degreesToRadians(safeDestinationLat))
      * Math.sin(dLng / 2) ** 2;
  const distanceKm = 2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  return Number.isFinite(distanceKm) && distanceKm > 0 && distanceKm <= 1000
    ? Math.round(distanceKm * 10) / 10
    : null;
}

function degreesToRadians(value: number) {
  return value * Math.PI / 180;
}
