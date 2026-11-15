export * from './user-types';
export * from './ad-types';
export * from './trip-types';

export interface MarketPulse {
  id: string;
  trend: 'high_demand' | 'high_supply' | 'balanced' | string;
  demand: number;
  supply: number;
  priceAnomaliesCount?: number;
  priceAnomalyTrend?: 'up' | 'down' | 'stable';
  emergencyAdCapacityActive?: boolean;
}

export type RegistrationPayload = any;
