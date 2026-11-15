/**
 * [SCR-CMD-310] Sovereign Cloud Contracts
 */

export interface SovereignCloudContracts {
  requestRide: {
    request: {
      seats: number;
      dropoff: string;
      pickup: string;
      pickupCoords: { lat: number; lng: number };
      gridId: string;
      district: string;
      pricingPreference: 'APP' | 'TAXI' | 'FREE' | null;
      estimatedTime: number;
      estimatedDistance: number;
      exactPickupCoords?: { lat: number; lng: number };
      riderName?: string;
      riderRating?: number;
    };
    response: { tripId: string };
  };

  submitTripFeedback: {
    request: {
      tripId: string;
      driverId: string;
      vehicleId: string;
      driverRating: number;
      vehicleRating: number;
      giveHeart: boolean;
      sensory: { cleanliness: number; quietness: number; adherence: number };
    };
    response: { success: boolean };
  };

  submitRiderRating: {
    request: {
      tripId: string;
      riderId: string;
      rating: number;
    };
    response: { success: boolean };
  };

  updateSovereignPricing: {
    request: {
      baseFare: number;
      perKm: number;
      perMin: number;
      activeDistrict: string;
    };
    response: { success: boolean; momentum: 'UP' | 'DOWN' | 'STABLE' | 'DUMPING' };
  };

  executeGuillotine: {
    request: { tripId: string };
    response: { success: boolean; message: string };
  };

  generateWeeklyReport: {
    request: void;
    response: { success: boolean; stats?: any; message?: string; newRank?: string };
  };

  cancelTrip: {
    request: { tripId: string; userId: string; ratingAdjustment?: number; consecutiveCancellations?: number };
    response: { success: boolean };
  };

  confirmCheckpoint: {
    request: { tripId: string; userId: string; ratingAdjustment?: number };
    response: { success: boolean };
  };

  endTrip: {
    request: { tripId: string };
    response: { success: boolean };
  };

  submitOffer: {
    request: { tripId: string; offer: any };
    response: { success: boolean };
  };
}
