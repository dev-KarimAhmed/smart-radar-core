export function calculateRiderRank(ratingSum?: number, ratingCount?: number): string {
  if (!ratingSum || !ratingCount) return 'Silver';
  const avg = ratingSum / ratingCount;
  if (avg >= 4.8) return 'Platinum';
  if (avg >= 4.3) return 'Gold';
  return 'Silver';
}
