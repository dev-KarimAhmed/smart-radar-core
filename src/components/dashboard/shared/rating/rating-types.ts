export type CriterionVerdict = 'up' | 'down' | null;

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
}

export type VehicleRatingKey = 'cleanliness' | 'ac' | 'comfort' | 'quietness' | 'safety';
export type CaptainRatingKey = 'behavior' | 'driving' | 'punctuality' | 'routing' | 'communication';

export const initialVehicleRatings: Record<VehicleRatingKey, CriterionVerdict> = {
  cleanliness: null,
  ac: null,
  comfort: null,
  quietness: null,
  safety: null,
};

export const initialCaptainRatings: Record<CaptainRatingKey, CriterionVerdict> = {
  behavior: null,
  driving: null,
  punctuality: null,
  routing: null,
  communication: null,
};

/** Drops unanswered criteria; 'up' scores 1, 'down' scores 0. */
export function toScoredCriteria(values: Record<string, CriterionVerdict>) {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, verdict]) => verdict !== null)
      .map(([key, verdict]) => [key, verdict === 'up' ? 1 : 0]),
  );
}
