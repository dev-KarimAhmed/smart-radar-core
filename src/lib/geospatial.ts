import { SOVEREIGN_CONSTANTS } from '@/core/constants/sovereign-protocols';

const EARTH_RADIUS_KM = 6371;

/**
 * [SCR-2026-051] التقاط وتحقق من بنية روابط خرائط جوجل
 */
export const isGoogleMapsLink = (url: string): boolean => {
  if (!url) return false;
  return url.includes('google.com/maps') || url.includes('goo.gl') || url.includes('maps.app.goo.gl');
};

export const generateSovereignSearchUrl = (areaName: string = ""): string => {
  const query = areaName ? encodeURIComponent(areaName) : "My+Location";
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

export const extractSovereignCoordinates = (url: string): { lat: number; lng: number } | null => {
  if (!url) return null;
  try {
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /query=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }
    return null;
  } catch (error) {
    const { trackSovereignError } = require('@/lib/error-tracker');
    trackSovereignError(error, { context: 'extractSovereignCoordinates_failed', url });
    return null;
  }
};

export function estimateTripTime(
  distanceKm: number, 
  marketPulse: 'critical' | 'active' | 'stable' | 'dormant' = 'stable'
): number {
  let vPulseSpeed: number;
  switch (marketPulse) {
    case 'critical': vPulseSpeed = SOVEREIGN_CONSTANTS.PULSE_SPEED_CRITICAL; break;
    case 'active': vPulseSpeed = SOVEREIGN_CONSTANTS.PULSE_SPEED_ACTIVE; break;
    case 'stable':
    case 'dormant':
    default: vPulseSpeed = SOVEREIGN_CONSTANTS.PULSE_SPEED_STABLE; break;
  }
  const timeInHours = distanceKm / vPulseSpeed;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  return Math.max(timeInMinutes, SOVEREIGN_CONSTANTS.MIN_TRIP_DURATION_MIN);
}

const MOCK_DISTRICT_CENTERS = [
    { name: 'وادي السير', governorate: 'عمان', lat: 31.95, lng: 35.82 },
    { name: 'الجامعة', governorate: 'عمان', lat: 31.99, lng: 35.86 },
    { name: 'قصبة عمان', governorate: 'عمان', lat: 31.95, lng: 35.93 },
    { name: 'ماركا', governorate: 'عمان', lat: 31.98, lng: 36.00 },
    { name: 'ناعور', governorate: 'عمان', lat: 31.87, lng: 35.83 },
    { name: 'قصبة إربد', governorate: 'إربد', lat: 32.55, lng: 35.85 },
    { name: 'الرمثا', governorate: 'إربد', lat: 32.56, lng: 36.00 },
    { name: 'قصبة الزرقاء', governorate: 'الزرقاء', lat: 32.08, lng: 36.09 },
];

export function getDistrictFromCoords(lat: number, lng: number): { district?: string, governorate?: string } {
    if (!lat || !lng) return {};
    let closestDistrict = '';
    let closestGovernorate = '';
    let minDistance = Infinity;
    for (const center of MOCK_DISTRICT_CENTERS) {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const dLat = toRad(center.lat - lat);
        const dLon = toRad(center.lng - lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat)) * Math.cos(toRad(center.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = EARTH_RADIUS_KM * c;
        if (distance < minDistance) {
            minDistance = distance;
            closestDistrict = center.name;
            closestGovernorate = center.governorate;
        }
    }
    return minDistance < 20 ? { district: closestDistrict, governorate: closestGovernorate } : {};
}
