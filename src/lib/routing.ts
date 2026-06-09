import type { Trip } from "@/core/types";

export function generateSovereignRouteUrl(trip?: Trip | null): string {
  if (!trip) return "https://www.google.com/maps";
  
  const pickup = trip.pickupCoords
    ? `${trip.pickupCoords.lat},${trip.pickupCoords.lng}`
    : "31.9522,35.9106";
    
  const dropoff = trip.dropoff
    ? encodeURIComponent(trip.dropoff)
    : "31.9522,35.9106";

  return `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=driving`;
}
