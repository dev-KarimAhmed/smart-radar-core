import { SOVEREIGN_CONSTANTS } from './constants';

export function calculateSovereignRank(averageRating: number, heartCount: number) {
    const { PLATINUM, GOLD, SILVER, BRONZE } = SOVEREIGN_CONSTANTS.RANKING_RULES;
    if (averageRating >= PLATINUM.minRating && heartCount >= PLATINUM.minHearts) return PLATINUM.name;
    if (averageRating >= GOLD.minRating && heartCount >= GOLD.minHearts) return GOLD.name;
    if (averageRating >= SILVER.minRating) return SILVER.name;
    return BRONZE.name;
}
