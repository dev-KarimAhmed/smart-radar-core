export type CriterionVerdict = 'up' | 'down' | null;

export interface DriverRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
  tripId: string;
  riderId: string;
  captainId: string;
  supabase: any;
  onSuccess: () => void;
  riderName?: string;
}

export type RiderRatingKey = 'respect' | 'punctuality' | 'cleanliness' | 'communication' | 'cooperation';

export const initialRiderRatings: Record<RiderRatingKey, CriterionVerdict> = {
  respect: null,
  punctuality: null,
  cleanliness: null,
  communication: null,
  cooperation: null,
};

