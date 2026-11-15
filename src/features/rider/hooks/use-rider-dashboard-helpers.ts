import { HistoricalTrip, FavoriteCaptain } from '../components/dashboard/dashboard-shared';

export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const sanitizeText = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
};

const normalizeFavoriteValue = (value: string | null | undefined) => sanitizeText(value).trim().toLowerCase();

export const getFavoriteStableId = (favorite: Pick<FavoriteCaptain, 'captainId' | 'captainPhone' | 'captainName' | 'tripId'>) =>
  normalizeFavoriteValue(favorite.captainId) ||
  normalizeFavoriteValue(favorite.captainPhone) ||
  normalizeFavoriteValue(favorite.captainName) ||
  normalizeFavoriteValue(favorite.tripId);

export const favoriteMatchesTrip = (favorite: FavoriteCaptain, trip: HistoricalTrip) => {
  const tripCaptainId = normalizeFavoriteValue(trip.captainId);
  const favoriteCaptainId = normalizeFavoriteValue(favorite.captainId);

  if (tripCaptainId && favoriteCaptainId && tripCaptainId === favoriteCaptainId) return true;
  if (normalizeFavoriteValue(favorite.captainPhone) && normalizeFavoriteValue(favorite.captainPhone) === normalizeFavoriteValue(trip.captainPhone)) return true;

  return (
    normalizeFavoriteValue(favorite.captainName) === normalizeFavoriteValue(trip.captainName) &&
    normalizeFavoriteValue(favorite.vehicleInfo) === normalizeFavoriteValue(trip.vehicleInfo)
  );
};
