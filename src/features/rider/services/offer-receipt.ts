/**
 * The amounts on an offer's price receipt, derived so that they always sum to the total.
 *
 * WHAT WENT WRONG
 *
 * The card listed the parts someone had remembered to list — distance, time, the captain's
 * adjustment — and then the total, computed independently. `baseFare` was in the receipt
 * data and was never printed, so a real offer rendered as:
 *
 *   المسافة · 0 كم × 6.00      0.00
 *   الوقت · 12 دقيقة × 2.00   24.00
 *   زيادة اختارها الكابتن   +176.13
 *   السعر الإجمالي           220.13     <- 20.00 more than the rows above
 *
 * No amount of reading those four lines produces the fifth. The rider's complaint was not
 * that the pricing is complicated; it is that the receipt was arithmetically false.
 *
 * Two more amounts could go missing the same way. `meter_fare` in submit_ride_offer is
 *
 *   max(country min_fare, base_fare, base_fare + billable_km*perKm + minutes*perMin)
 *
 * so on a short trip the country's minimum fare can be what sets the price with nothing on
 * screen saying so. And the offered fare is whatever the captain submitted, which is not
 * guaranteed to equal meter + adjustment.
 *
 * THE RULE HERE
 *
 * Every amount is derived from the two numbers that are authoritative — the receipt the
 * server stored, and the fare actually being charged — and whatever is left over after the
 * named parts is returned as a residual. A row of that residual is rendered when it is
 * non-zero, so the column can no longer disagree with its own total. `sumsToTotal` states
 * the invariant for a test to hold.
 */

export interface OfferReceiptBreakdown {
  baseFare?: number;
  perKm?: number;
  perMin?: number;
  includedKm?: number;
  roadKm?: number;
  billableKm?: number;
  minutes?: number;
  kmCharge?: number;
  minCharge?: number;
  meterFare?: number;
  marketFare?: number | null;
  minTripFare?: number | null;
  adjustment?: number;
  tariffMissing?: boolean;
}

export interface OfferReceipt {
  /** Fixed starting fare. Was never rendered — the whole defect. */
  baseFare: number;
  /** Charge for the kilometres past the captain's included allowance. */
  kmCharge: number;
  /** Charge for the trip's minutes. */
  minCharge: number;
  /** What the country's minimum fare added on top of the metered parts, if it bound. */
  minFareTopUp: number;
  /** baseFare + kmCharge + minCharge + minFareTopUp. */
  meterFare: number;
  /** What the captain added to (or took off) their own meter. Signed. */
  adjustment: number;
  /** Whatever is left between the meter, the adjustment and the fare charged. Signed. */
  residual: number;
  /** The fare the rider pays. */
  finalFare: number;
  /** How far the final fare sits from the market average, in whole percent. 0 when unknown. */
  marketDeviationPercent: number;
  marketFare: number;
  /** True when the named rows plus the residual reach the total, to the cent. */
  sumsToTotal: boolean;
}

function money(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

export function buildOfferReceipt(
  breakdown: OfferReceiptBreakdown | null | undefined,
  finalFareInput: number,
): OfferReceipt {
  const finalFare = money(finalFareInput);
  const marketFare = money(breakdown?.marketFare);
  const marketDeviationPercent = marketFare > 0
    ? Math.round(((finalFare - marketFare) / marketFare) * 100)
    : 0;

  // No tariff was recorded with the offer, so there are no parts. The whole fare is the
  // residual rather than being attributed to rows that were never measured.
  if (!breakdown || breakdown.tariffMissing) {
    return {
      baseFare: 0,
      kmCharge: 0,
      minCharge: 0,
      minFareTopUp: 0,
      meterFare: 0,
      adjustment: 0,
      residual: finalFare,
      finalFare,
      marketDeviationPercent,
      marketFare,
      sumsToTotal: true,
    };
  }

  const baseFare = money(breakdown.baseFare);
  const kmCharge = money(breakdown.kmCharge);
  const minCharge = money(breakdown.minCharge);
  const storedMeterFare = money(breakdown.meterFare);

  // The gap between the metered parts and the meter total the server recorded. Positive when
  // the country's minimum fare lifted it; clamped at 0 because a NEGATIVE gap would mean the
  // stored meter is less than its own parts, and that belongs in the residual as an
  // unexplained difference rather than being shown as a discount nobody granted.
  const minFareTopUp = Math.max(0, money(storedMeterFare - (baseFare + kmCharge + minCharge)));
  const meterFare = money(baseFare + kmCharge + minCharge + minFareTopUp);

  const adjustment = money(breakdown.adjustment);
  const residual = money(finalFare - (meterFare + adjustment));

  const rowsTotal = money(baseFare + kmCharge + minCharge + minFareTopUp + adjustment + residual);

  return {
    baseFare,
    kmCharge,
    minCharge,
    minFareTopUp,
    meterFare,
    adjustment,
    residual,
    finalFare,
    marketDeviationPercent,
    marketFare,
    sumsToTotal: Math.abs(rowsTotal - finalFare) < 0.005,
  };
}
