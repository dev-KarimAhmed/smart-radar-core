import { cellToLatLng, gridDisk, isValidCell, latLngToCell } from 'h3-js';

export interface MockCaptainDot {
  id: string;
  serial: string;
  h3Cell: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  etaMinutes: number;
  rank: 'Platinum' | 'Gold' | 'Silver';
}

export const RIDER_MOCK_LOCATION = {
  lat: 30.0444,
  lng: 31.2357,
};

export function getRiderMockH3Cell(location = RIDER_MOCK_LOCATION, resolution = 9) {
  return latLngToCell(location.lat, location.lng, resolution);
}

export function generateMockCaptainDots(riderH3Cell: string): MockCaptainDot[] {
  if (!isValidCell(riderH3Cell)) return [];

  return gridDisk(riderH3Cell, 2)
    .filter((cell) => cell !== riderH3Cell)
    .slice(0, 5)
    .map((cell, index) => {
      const [lat, lng] = cellToLatLng(cell);

      return {
        id: `mock-captain-dot-${index + 1}`,
        serial: `D-${102 + index * 7}`,
        h3Cell: cell,
        coordinates: { lat, lng },
        etaMinutes: 2 + index,
        rank: index === 0 ? 'Platinum' : index <= 2 ? 'Gold' : 'Silver',
      };
    });
}
