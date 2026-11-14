import type { Offer } from '@/core/types';

export function parseDriverRank(value: string | null): Offer['driverRank'] {
  const normalized = `${value || ''}`.toLowerCase();
  if (normalized.includes('platinum')) return 'Platinum';
  if (normalized.includes('gold')) return 'Gold';
  if (normalized.includes('silver')) return 'Silver';
  return 'Bronze';
}

export function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function hasAny(row: Record<string, unknown>, ...keys: string[]): boolean {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(row, key));
}

export function toFiniteNumber(value: unknown, fieldName: string): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`invalid_${fieldName}`);
  }

  return numberValue;
}

export function toStrictPositiveInteger(value: unknown, fieldName: string): number {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`invalid_${fieldName}`);
  }

  return numberValue;
}

export function toPositiveMetric(value: number | undefined): number | null {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : null;
}

export function parseServerEstimatedFare(data: unknown): number {
  if (typeof data === 'number') return toFiniteNumber(data, 'server_estimated_fare');

  const firstRow = Array.isArray(data) ? data[0] : data;
  const value = (firstRow as { server_estimated_fare?: unknown } | null)?.server_estimated_fare;

  return toFiniteNumber(value, 'server_estimated_fare');
}
