/**
 * Audience routing for ad campaigns.
 *
 * `public.ad_campaigns.for_driver` is the sovereign audience switch: TRUE sends
 * the campaign to captains, FALSE (and a missing/NULL value, which is what the
 * column defaults to) sends it to riders. It is a plain boolean, so there is no
 * "both audiences" state — every campaign belongs to exactly one side.
 */
export type AdAudience = 'rider' | 'captain';

/** Reads the audience off a raw `ad_campaigns` row. */
export function readAdAudience(row: Record<string, any> | null | undefined): AdAudience {
  const forDriver = row?.for_driver ?? row?.forDriver;
  const isForDriver = forDriver === true
    || (typeof forDriver === 'string' && forDriver.trim().toLowerCase() === 'true');

  return isForDriver ? 'captain' : 'rider';
}

/**
 * Keeps only the campaigns belonging to `audience`. An undefined audience means
 * the host screen is not audience-scoped, so the whole pool passes through.
 */
export function filterAdsByAudience<T extends { forDriver?: boolean }>(
  ads: T[],
  audience?: AdAudience,
): T[] {
  if (!audience) return ads;

  return ads.filter((ad) => (ad?.forDriver === true ? 'captain' : 'rider') === audience);
}
