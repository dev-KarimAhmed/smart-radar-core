import assert from 'node:assert/strict';
import test from 'node:test';
import { prioritizeRiderOffers, matchesRequestedMode } from './rider-offer-ranking';

test('prioritizeRiderOffers: matches requested mode first', () => {
  const offers = [
    { id: '1', pricing_mode: 'FREE', driverRank: 'GOLD', finalFare: 10 },
    { id: '2', pricing_mode: 'APP', driverRank: 'SILVER', finalFare: 12 },
    { id: '3', pricing_mode: 'TAXI', driverRank: 'PLATINUM', finalFare: 15 },
  ];

  const appSorted = prioritizeRiderOffers(offers, [], 'APP');
  assert.equal(appSorted[0].id, '2', 'APP offer should come first when APP requested');

  const taxiSorted = prioritizeRiderOffers(offers, [], 'TAXI');
  assert.equal(taxiSorted[0].id, '3', 'TAXI offer should come first when TAXI requested');

  const freeSorted = prioritizeRiderOffers(offers, [], 'FREE');
  assert.equal(freeSorted[0].id, '1', 'FREE offer should come first when FREE requested');
});

test('prioritizeRiderOffers: favorite captains float before non-favorites', () => {
  const offers = [
    { id: 'offer-1', driverId: 'cap-1', pricing_mode: 'APP', driverRank: 'PLATINUM', finalFare: 10 },
    { id: 'offer-2', driverId: 'cap-fav', pricing_mode: 'APP', driverRank: 'BRONZE', finalFare: 15 },
  ];

  const sorted = prioritizeRiderOffers(offers, ['cap-fav'], 'APP');
  assert.equal(sorted[0].id, 'offer-2', 'Favorite captain should float before higher-ranked non-favorite');
});

test('prioritizeRiderOffers: captain rank sorting (Platinum > Gold > Silver > Bronze)', () => {
  const offers = [
    { id: 'bronze', driverRank: 'BRONZE', finalFare: 10 },
    { id: 'gold', driverRank: 'GOLD', finalFare: 10 },
    { id: 'platinum', driverRank: 'PLATINUM', finalFare: 10 },
    { id: 'silver', driverRank: 'SILVER', finalFare: 10 },
  ];

  const sorted = prioritizeRiderOffers(offers, [], null);
  assert.deepEqual(sorted.map((o) => o.id), ['platinum', 'gold', 'silver', 'bronze']);
});

test('prioritizeRiderOffers: higher rating score floats before lower rating when rank is equal', () => {
  const offers = [
    { id: 'cap-4.8', driverRank: 'GOLD', driverRating: 4.8, finalFare: 10 },
    { id: 'cap-5.0', driverRank: 'GOLD', driverRating: 5.0, finalFare: 10 },
    { id: 'cap-4.9', driverRank: 'GOLD', driverRating: 4.9, finalFare: 10 },
  ];

  const sorted = prioritizeRiderOffers(offers, [], null);
  assert.deepEqual(sorted.map((o) => o.id), ['cap-5.0', 'cap-4.9', 'cap-4.8']);
});

test('prioritizeRiderOffers: lower fare wins when rank and rating are equal', () => {
  const offers = [
    { id: 'high-fare', driverRank: 'GOLD', driverRating: 4.9, finalFare: 25 },
    { id: 'low-fare', driverRank: 'GOLD', driverRating: 4.9, finalFare: 15 },
  ];

  const sorted = prioritizeRiderOffers(offers, [], null);
  assert.equal(sorted[0].id, 'low-fare');
});

test('prioritizeRiderOffers: multiple captains - favorite comes first and highest price is last', () => {
  // Scenario requested by user:
  // Multiple captains submitted offers:
  // - Captain A: Non-favorite, price 25 JOD, Platinum
  // - Captain B: Favorite captain, price 30 JOD, Bronze
  // - Captain C: Non-favorite, price 12 JOD, Silver
  // - Captain D: Non-favorite, price 45 JOD, Gold
  const offers = [
    { id: 'cap-plat-25', driverId: 'c1', driverRank: 'PLATINUM', finalFare: 25 },
    { id: 'cap-fav-30', driverId: 'c-fav', driverRank: 'BRONZE', finalFare: 30 },
    { id: 'cap-silv-12', driverId: 'c2', driverRank: 'SILVER', finalFare: 12 },
    { id: 'cap-gold-45', driverId: 'c3', driverRank: 'GOLD', finalFare: 45 },
  ];

  const sorted = prioritizeRiderOffers(offers, ['c-fav'], null);

  // 1. Priority is for the favorite captain:
  assert.equal(sorted[0].id, 'cap-fav-30', 'Favorite captain must have top priority and float first');

  // 2. Next should be the lowest price among non-favorites:
  assert.equal(sorted[1].id, 'cap-silv-12', 'Lowest price among remaining captains should come second');

  // 3. Next is 25 JOD:
  assert.equal(sorted[2].id, 'cap-plat-25', 'Middle price should come third');

  // 4. And the last thing should be the one with the highest price:
  assert.equal(sorted[3].id, 'cap-gold-45', 'Highest price offer must be at the very end');
  assert.equal(sorted[sorted.length - 1].id, 'cap-gold-45', 'Last position must be the highest price');
});

test('prioritizeRiderOffers: multiple non-favorites - sorted by price ascending, highest price is last', () => {
  // When no favorites, lower price always wins over rank, and highest price is at the end
  const offers = [
    { id: 'expensive-platinum', driverRank: 'PLATINUM', finalFare: 50 },
    { id: 'cheap-bronze', driverRank: 'BRONZE', finalFare: 10 },
    { id: 'mid-gold', driverRank: 'GOLD', finalFare: 20 },
  ];

  const sorted = prioritizeRiderOffers(offers, [], null);

  assert.equal(sorted[0].id, 'cheap-bronze', 'Lowest price (10) must be first');
  assert.equal(sorted[1].id, 'mid-gold', 'Middle price (20) must be second');
  assert.equal(sorted[2].id, 'expensive-platinum', 'Highest price (50) must be last');
});

test('prioritizeRiderOffers: multiple favorites - favorites all come first sorted by lowest price, then non-favorites with highest price last', () => {
  const offers = [
    { id: 'nonfav-high', driverId: 'nf-1', finalFare: 60 },
    { id: 'fav-expensive', driverId: 'fav-1', finalFare: 35 },
    { id: 'nonfav-low', driverId: 'nf-2', finalFare: 15 },
    { id: 'fav-cheap', driverId: 'fav-2', finalFare: 20 },
  ];

  const sorted = prioritizeRiderOffers(offers, ['fav-1', 'fav-2'], null);

  // Both favorites come first, with the cheaper favorite first
  assert.equal(sorted[0].id, 'fav-cheap', 'Cheaper favorite must come first');
  assert.equal(sorted[1].id, 'fav-expensive', 'More expensive favorite comes second');

  // Non-favorites come next, with highest price at the very end
  assert.equal(sorted[2].id, 'nonfav-low', 'Cheaper non-favorite comes third');
  assert.equal(sorted[3].id, 'nonfav-high', 'Most expensive overall must be last');
});

test('prioritizeRiderOffers: earlier offer comes before later offer when all else equal (latest at bottom)', () => {
  const offers = [
    { id: 'newer-offer', driverRank: 'BRONZE', driverRating: 5.0, finalFare: 20, created_at: '2026-10-07T12:00:10Z' },
    { id: 'older-offer', driverRank: 'BRONZE', driverRating: 5.0, finalFare: 20, created_at: '2026-10-07T12:00:00Z' },
  ];

  const sorted = prioritizeRiderOffers(offers, [], null);
  assert.equal(sorted[0].id, 'older-offer', 'Older offer should be at top');
  assert.equal(sorted[1].id, 'newer-offer', 'Newer offer should be at bottom');
});
