export type CaptainTariff = {
  /** فتحة العداد الأساسية — must be >= the country's regulated floor. */
  baseFare: number;
  /** سعر الكيلومتر الإضافي */
  pricePerKm: number;
  /** سعر الدقيقة — driving time, including time lost to traffic. */
  pricePerMin: number;
  /** المسافة المشمولة في فتحة العداد — km billed at zero before per-km charging starts. */
  includedKm: number;
  /** النمط المفضل للتسعير (أسعار حرة أم أسعار التطبيق أم تاكسي) */
  pricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
};

export type CaptainTariffSaveResult =
  | { saved: true }
  | { saved: false; reason: 'base_fare_below_market_minimum'; minBaseFare: number }
  | { saved: false; reason: 'unknown' };

/** Which reference produced `minBaseFare` — see public.market_sample_threshold(). */
export type MinBaseFareSource = 'captain_average' | 'country_seed';

/** Which area the market average was actually computed over. */
export type MarketAverageScope = 'governorate' | 'country' | 'country_seed';

/** Full result of public.market_average_tariff() — one reference number per tariff field. */
export type MarketAverageTariff = {
  baseFare: number;
  perKm: number;
  perMin: number;
  includedKm: number;
  captainCount: number;
  threshold: number;
  scope: MarketAverageScope;
  source: MinBaseFareSource;
};

export type TariffContext = {
  baseFare: number | null;
  pricePerKm: number | null;
  pricePerMin: number | null;
  includedKm: number;
  pricingMode: 'FREE' | 'APP' | 'TAXI' | null;
  /** Lowest meter-opening charge this captain may set. */
  minBaseFare: number;
  minBaseFareSource: MinBaseFareSource;
  /** Per-field market averages for the whole tariff, not just the base-fare floor. */
  marketAverage: MarketAverageTariff | null;
};

export const FALLBACK_MIN_BASE_FARE = 1;
