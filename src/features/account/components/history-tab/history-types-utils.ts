export interface HistoricalTrip {
  tripId: string;
  captainId?: string;
  serialId?: string;
  captainName: string;
  captainRank: 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
  pickupAddress?: string;
  destinationAddress?: string;
  distanceKm?: number;
  durationMinutes?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export const HISTORY_TTL_MS = 3 * 24 * 60 * 60 * 1000;
export const UNAVAILABLE_FALLBACK = '';

export function normalizeCaptainRank(value: unknown): HistoricalTrip['captainRank'] {
  const normalized = `${value || ''}`.toUpperCase();
  if (normalized.includes('DIAMOND') || normalized.includes('ماس')) return 'DIAMOND';
  if (normalized.includes('PLATINUM')) return 'PLATINUM';
  if (normalized.includes('GOLD')) return 'GOLD';
  if (normalized.includes('SILVER')) return 'SILVER';
  return 'BRONZE';
}

export function formatVehicleInfo(vehicle: any): string {
  if (!vehicle || typeof vehicle !== 'object') return UNAVAILABLE_FALLBACK;
  const parts = [
    vehicle.make,
    vehicle.vehicle_make,
    vehicle.brand,
    vehicle.vehicle_brand,
    vehicle.model,
    vehicle.vehicle_model,
    vehicle.color,
    vehicle.vehicle_color,
    vehicle.plate,
    vehicle.plate_number,
    vehicle.vehicle_plate,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' - ') : UNAVAILABLE_FALLBACK;
}

export function isPlainRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function firstHistoryString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

export function firstHistoryNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function formatHistoryMoney(value: number, currencyLabel: string): string {
  return currencyLabel ? `${Number(value).toFixed(2)} ${currencyLabel}` : Number(value).toFixed(2);
}
