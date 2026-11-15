export interface ParsedMapLocation {
  lat: number;
  lng: number;
}

export interface ResolvedLocationGeography {
  governorate?: string | null;
  district?: string | null;
  city?: string | null;
  governorateCandidates?: string[];
  districtCandidates?: string[];
}

/**
 * Result of comparing the extracted coordinate against where the link's place NAME geocodes
 * to. Absent means "could not be checked" — never "checked and fine".
 */
export interface PlaceNameCheck {
  placeName: string;
  geocodedLocation: ParsedMapLocation;
  distanceKm: number;
  isMismatch: boolean;
}

export interface ResolvedClipboardMapLocation {
  location: ParsedMapLocation;
  resolvedUrl: string;
  geography?: ResolvedLocationGeography;
  placeNameCheck?: PlaceNameCheck;
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class ClipboardMapLocationError extends Error {
  constructor(
    public readonly code: 'INVALID_MAPS_LINK' | 'COORDINATES_NOT_FOUND' | 'RESOLUTION_FAILED',
  ) {
    super(code);
    this.name = 'ClipboardMapLocationError';
  }
}

export function isValidLocation(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
