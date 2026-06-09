// نظام الإحداثيات والشبكة الجغرافية السيادية (Sovereign Grid System)
// تقسيم الإحداثيات الجغرافية لشبكات وحقول بحجم تقريبي 1.1 كم * 1.1 كم

export const calculateSovereignGridId = (lat: number, lng: number): string => {
  const gridLat = (Math.floor(lat * 100) / 100).toFixed(2);
  const gridLng = (Math.floor(lng * 100) / 100).toFixed(2);
  return `${gridLat}_${gridLng}`;
};

/**
 * [SCR-CMD-009] Generates the 9-grid matrix for the expanded radar.
 * Creates a 3x3 grid of geographic IDs around the driver's current location.
 * @param lat The driver's current latitude.
 * @param lng The driver's current longitude.
 * @returns An array of unique grid ID strings.
 */
export const getSurroundingGridIds = (lat: number, lng: number): string[] => {
    const gridPrecision = 0.01; // Corresponds to ~1.1km
    const centralLat = Math.floor(lat / gridPrecision) * gridPrecision;
    const centralLng = Math.floor(lng / gridPrecision) * gridPrecision;

    const gridIds = new Set<string>();

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const gridLat = (centralLat + (i * gridPrecision)).toFixed(2);
            const gridLng = (centralLng + (j * gridPrecision)).toFixed(2);
            gridIds.add(`${gridLat}_${gridLng}`);
        }
    }

    return Array.from(gridIds);
};
