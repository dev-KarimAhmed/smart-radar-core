export const RATING_MEMORY_WINDOW_HOURS = 72;
export const RATING_MEMORY_WINDOW_MS = RATING_MEMORY_WINDOW_HOURS * 60 * 60 * 1000;

export function isRatingWindowExpired(completedAt: unknown, now = Date.now()): boolean {
  if (!completedAt) return false;
  const parsedMs = typeof completedAt === 'number' ? completedAt : new Date(String(completedAt)).getTime();
  if (!Number.isFinite(parsedMs) || parsedMs <= 0) return false;
  return now - parsedMs > RATING_MEMORY_WINDOW_MS;
}

export type CriterionVerdict = 'up' | 'down' | null;
export type AdComplianceVerdict = 'compliant' | 'non_compliant' | null;

export interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  captainId: string;
  reviewerId: string;
  supabase: any;
  onSuccess: () => void;
  captainName?: string;
  captainPhone?: string;
  captainRank?: 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  vehicleInfo?: string;
  finalPrice?: number;
  completedAt?: string | number | null;
}

export type VehicleCriterionKey = 'interior' | 'exterior' | 'comfort';

export interface VehicleRatings {
  interior: number; // 0 = unrated, 1-5 stars
  exterior: number;
  comfort: number;
}

export interface CaptainRatings {
  adCompliance: AdComplianceVerdict;
  communication: number; // 0 = unrated, 1-5 stars
}

export const initialVehicleRatings: VehicleRatings = {
  interior: 0,
  exterior: 0,
  comfort: 0,
};

export const initialCaptainRatings: CaptainRatings = {
  adCompliance: null,
  communication: 0,
};

/**
 * Normalizes scores to 0..1 scale so PostgreSQL sovereign_stars_to_rating
 * aggregates accurately without dropping data.
 */
export function buildDetailedStarsPayload(params: {
  captain: CaptainRatings;
  vehicle: VehicleRatings;
  isFavorite: boolean;
}) {
  const { captain, vehicle, isFavorite } = params;

  const captainObj: Record<string, number> = {};
  if (captain.adCompliance !== null) {
    captainObj.ad_compliance = captain.adCompliance === 'compliant' ? 1 : 0;
  }
  if (captain.communication > 0) {
    captainObj.communication = Number((captain.communication / 5).toFixed(2));
  }

  const vehicleObj: Record<string, number> = {};
  if (vehicle.interior > 0) {
    vehicleObj.interior = Number((vehicle.interior / 5).toFixed(2));
  }
  if (vehicle.exterior > 0) {
    vehicleObj.exterior = Number((vehicle.exterior / 5).toFixed(2));
  }
  if (vehicle.comfort > 0) {
    vehicleObj.comfort = Number((vehicle.comfort / 5).toFixed(2));
  }

  return {
    captain: captainObj,
    vehicle: vehicleObj,
    raw_scores: {
      ad_compliance: captain.adCompliance,
      communication_stars: captain.communication,
      interior_stars: vehicle.interior,
      exterior_stars: vehicle.exterior,
      comfort_stars: vehicle.comfort,
      is_favorite: isFavorite,
    },
  };
}
