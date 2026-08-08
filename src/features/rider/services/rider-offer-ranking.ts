import type { CaptainRank } from '../components/captain-offer-card';
import { firstDisplayString } from './rider-view-format';
import { toCaptainOfferRank } from './rider-offer-fields';

export function prioritizeRiderOffers<T extends Record<string, any>>(offers: T[], favoriteIds: string[]) {
  const rankWeight: Record<CaptainRank, number> = {
    PLATINUM: 4,
    GOLD: 3,
    SILVER: 2,
    BRONZE: 1,
  };

  return offers.map((offer) => ({
    ...offer,
    __isPreferredCaptain: isPreferredOffer(offer, favoriteIds),
  })).sort((a, b) => {
    const aIsFavorite = isPreferredOffer(a, favoriteIds);
    const bIsFavorite = isPreferredOffer(b, favoriteIds);

    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    const aRankWeight = rankWeight[toCaptainOfferRank(a?.captain?.rank || a?.captain?.tier || a?.driverRank || a?.tier)] || 2;
    const bRankWeight = rankWeight[toCaptainOfferRank(b?.captain?.rank || b?.captain?.tier || b?.driverRank || b?.tier)] || 2;

    if (aRankWeight !== bRankWeight) return bRankWeight - aRankWeight;

    return getComparableOfferFare(a) - getComparableOfferFare(b);
  }) as T[];
}

export function collectPreferredCaptainIds(favorites: Array<Record<string, any>> = []) {
  const ids = new Set<string>();

  const addValue = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) ids.add(value.trim());
    if (typeof value === 'number' && Number.isFinite(value)) ids.add(String(value));
  };

  favorites.forEach((favorite) => {
    addValue(favorite?.captainId);
    addValue(favorite?.driverId);
    addValue(favorite?.captainPhone);
  });

  if (typeof window !== 'undefined') {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith('radar_preferred_captain_')) continue;

      addValue(key.replace('radar_preferred_captain_', ''));

      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || '{}');
        addValue(parsed?.captainId);
        addValue(parsed?.driverId);
        addValue(parsed?.id);
        addValue(parsed?.phone);
        addValue(parsed?.phoneNumber);
        addValue(parsed?.captainPhone);
      } catch {
        // Ignore legacy/non-JSON favorite entries.
      }
    }
  }

  return Array.from(ids);
}

export function isPreferredOffer(offer: Record<string, any>, favoriteIds: string[]) {
  if (favoriteIds.length === 0) return false;
  const favoriteTokens = favoriteIds.map(normalizeFavoriteToken).filter(Boolean);
  const favoriteSet = new Set(favoriteTokens);
  const offerTokens = getOfferFavoriteIdentifiers(offer).map(normalizeFavoriteToken).filter(Boolean);

  return offerTokens.some((offerToken) => favoriteSet.has(offerToken));
}

export function getOfferFavoriteIdentifiers(offer: Record<string, any>) {
  return [
    offer?.captain?.id,
    offer?.captain_id,
    offer?.captainId,
    offer?.driverId,
    offer?.driver_id,
    offer?.id,
    offer?.driverAffiliation?.phone,
    offer?.captain?.phone,
    offer?.captain?.phone_number,
  ]
    .map((value) => firstDisplayString(value))
    .filter(Boolean);
}

export function normalizeFavoriteToken(value: unknown) {
  const raw = firstDisplayString(value).trim().toLowerCase();
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 7) return digits.replace(/^00/, '');

  return raw
    .replace(/[ً-ٟ]/g, '')
    .replace(/[\s\-_.()+]/g, '')
    .trim();
}

export function getComparableOfferFare(offer: Record<string, any>) {
  const value = Number(
    offer?.finalFare ??
      offer?.final_fare ??
      offer?.submitted_fare ??
      offer?.offer_price ??
      offer?.price ??
      Number.MAX_SAFE_INTEGER,
  );

  return Number.isFinite(value) && value >= 0 ? value : Number.MAX_SAFE_INTEGER;
}
