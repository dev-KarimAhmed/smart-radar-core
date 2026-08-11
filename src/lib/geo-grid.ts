import { getH3Neighbors, latLngToH3Cell } from '@/core/logic/geospatial-kernel';

export const calculateSovereignGridId = (lat: number, lng: number): string => {
  return latLngToH3Cell(lat, lng, 9);
};

export const getSurroundingGridIds = (lat: number, lng: number): string[] => {
  return getH3Neighbors(calculateSovereignGridId(lat, lng), 1);
};
