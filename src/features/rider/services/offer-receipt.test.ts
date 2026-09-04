import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOfferReceipt, type OfferReceiptBreakdown } from './offer-receipt';

/** The rows the card prints, in order. Their sum is what the rider adds up by eye. */
function printedRows(receipt: ReturnType<typeof buildOfferReceipt>) {
  return [
    receipt.baseFare,
    receipt.kmCharge,
    receipt.minCharge,
    receipt.minFareTopUp,
    receipt.adjustment,
    receipt.residual,
  ];
}

function sumOf(rows: number[]) {
  return Math.round(rows.reduce((total, row) => total + row, 0) * 100) / 100;
}

test('the reported offer: the rows now reach the total they used to miss by the base fare', () => {
  // Straight from the screenshot behind "انا نفسي مش فاهم التسعير":
  // an 8 km trip, all 8 km inside the captain's included allowance, 12 minutes at 2.00,
  // a 20.00 starting fare that was never printed, and a 176.13 captain increase.
  const breakdown: OfferReceiptBreakdown = {
    baseFare: 20,
    perKm: 6,
    perMin: 2,
    includedKm: 8,
    roadKm: 8,
    billableKm: 0,
    minutes: 12,
    kmCharge: 0,
    minCharge: 24,
    meterFare: 44,
    marketFare: 241.89,
    adjustment: 176.13,
  };

  const receipt = buildOfferReceipt(breakdown, 220.13);

  assert.equal(receipt.baseFare, 20, 'the base fare must be a row of its own');
  assert.equal(receipt.meterFare, 44);
  assert.equal(receipt.residual, 0, 'nothing should be left unattributed here');
  assert.equal(sumOf(printedRows(receipt)), 220.13);
  assert.equal(receipt.sumsToTotal, true);
  // 220.13 against a 241.89 average is ~9% cheaper, not more expensive.
  assert.equal(receipt.marketDeviationPercent, -9);
});

test('the country minimum fare gets its own row instead of vanishing into the total', () => {
  // meter_fare is max(min_fare, base_fare, base + km + minutes). A very short trip meters at
  // 12.00 but the country floor is 20.00, so 8.00 of the price comes from neither the
  // distance nor the time and had nowhere to be shown.
  const receipt = buildOfferReceipt({
    baseFare: 10,
    perKm: 6,
    perMin: 2,
    includedKm: 0,
    roadKm: 0.2,
    billableKm: 0.2,
    minutes: 0.5,
    kmCharge: 1.2,
    minCharge: 1,
    meterFare: 20,
    minTripFare: 20,
    adjustment: 0,
  }, 20);

  assert.equal(receipt.minFareTopUp, 7.8);
  assert.equal(receipt.meterFare, 20);
  assert.equal(sumOf(printedRows(receipt)), 20);
  assert.equal(receipt.sumsToTotal, true);
});

test('a captain reduction is carried as a negative row and still balances', () => {
  const receipt = buildOfferReceipt({
    baseFare: 20,
    perKm: 6,
    perMin: 2,
    roadKm: 10,
    billableKm: 10,
    minutes: 15,
    kmCharge: 60,
    minCharge: 30,
    meterFare: 110,
    marketFare: 100,
    adjustment: -15,
  }, 95);

  assert.equal(receipt.adjustment, -15);
  assert.equal(sumOf(printedRows(receipt)), 95);
  assert.equal(receipt.sumsToTotal, true);
  assert.equal(receipt.marketDeviationPercent, -5);
});

test('a fare that does not equal meter plus adjustment surfaces as a residual row', () => {
  // The invariant that matters: whatever the server sends, the column adds up. A silent
  // mismatch is what produced the original complaint.
  const receipt = buildOfferReceipt({
    baseFare: 20,
    kmCharge: 60,
    minCharge: 30,
    meterFare: 110,
    adjustment: 10,
  }, 130);

  assert.equal(receipt.residual, 10);
  assert.equal(sumOf(printedRows(receipt)), 130);
  assert.equal(receipt.sumsToTotal, true);
});

test('a stored meter below its own parts is a residual, never a phantom discount', () => {
  // meterFare < base + km + min should not render as a negative "minimum fare" row, which
  // would read to the rider as money taken off that nobody offered.
  const receipt = buildOfferReceipt({
    baseFare: 20,
    kmCharge: 60,
    minCharge: 30,
    meterFare: 100,
    adjustment: 0,
  }, 100);

  assert.equal(receipt.minFareTopUp, 0);
  assert.equal(receipt.residual, -10);
  assert.equal(sumOf(printedRows(receipt)), 100);
  assert.equal(receipt.sumsToTotal, true);
});

test('an offer with no tariff receipt attributes the whole fare to one row', () => {
  const receipt = buildOfferReceipt({ tariffMissing: true, marketFare: 200 }, 180);

  assert.equal(receipt.residual, 180);
  assert.equal(sumOf(printedRows(receipt)), 180);
  assert.equal(receipt.sumsToTotal, true);
  assert.equal(receipt.marketDeviationPercent, -10);
});

test('a missing breakdown does not throw and still balances', () => {
  for (const value of [null, undefined]) {
    const receipt = buildOfferReceipt(value, 75.5);
    assert.equal(sumOf(printedRows(receipt)), 75.5);
    assert.equal(receipt.sumsToTotal, true);
    assert.equal(receipt.marketDeviationPercent, 0, 'no market fare means no comparison');
  }
});

test('non-numeric amounts are treated as zero rather than poisoning the column', () => {
  const receipt = buildOfferReceipt({
    baseFare: Number.NaN,
    kmCharge: undefined,
    minCharge: 30,
    meterFare: 30,
    adjustment: 5,
  } as OfferReceiptBreakdown, 35);

  assert.equal(receipt.baseFare, 0);
  assert.equal(receipt.kmCharge, 0);
  assert.equal(sumOf(printedRows(receipt)), 35);
  assert.equal(receipt.sumsToTotal, true);
});

console.log('offer receipt checks passed');
