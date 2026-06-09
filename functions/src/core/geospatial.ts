/**
 * [SCR-2026-002] The Sovereign Haversine Kernel (Backend Edition)
 * SSOT: المرجع الوحيد لحساب المسافات في السحاب.
 */
export function calculateSovereignDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const toRad = (value: number) => (value * Math.PI) / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const rawDistance = R * c;
  
    // URBAN_DETOUR_INDEX: 1.35 (لتعويض التعرج الأرضي)
    return rawDistance * 1.35;
  }
