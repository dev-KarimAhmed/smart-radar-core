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

