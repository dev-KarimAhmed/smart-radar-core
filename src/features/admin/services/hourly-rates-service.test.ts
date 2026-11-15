import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  CountryItem,
  GovernorateItem,
  DistrictItem,
  CustomRatesMatrix,
} from '@/features/admin/types/hourly-rates';

describe('hourly-rates types and fallback calculations', () => {
  it('correctly handles custom rates and inheritance fallbacks', () => {
    const countryDefaultPrice = 1.0;
    const customRates: CustomRatesMatrix = {
      governorates: { '1': 1.5 },
      districts: { '10': 2.0 },
    };

    // Gov 1 has custom price 1.5
    const gov1Price = customRates.governorates['1'] ?? countryDefaultPrice;
    assert.equal(gov1Price, 1.5);

    // Gov 2 does not have custom price -> falls back to countryDefaultPrice 1.0
    const gov2Price = customRates.governorates['2'] ?? countryDefaultPrice;
    assert.equal(gov2Price, 1.0);

    // District 10 has custom price 2.0
    const dist10Price = customRates.districts['10'] ?? gov1Price;
    assert.equal(dist10Price, 2.0);

    // District 11 inherits from Gov 1 (1.5)
    const dist11Price = customRates.districts['11'] ?? gov1Price;
    assert.equal(dist11Price, 1.5);

    // District 20 inherits from Gov 2 (1.0)
    const dist20Price = customRates.districts['20'] ?? gov2Price;
    assert.equal(dist20Price, 1.0);
  });

  it('validates CountryItem structure for Jordan and Egypt', () => {
    const jordan: CountryItem = {
      id: 1,
      country_code: 'JO',
      name_ar: 'الأردن',
      name_en: 'Jordan',
      currency_ar: 'د.أ',
      currency_en: 'JOD',
      radar_hour_price: 1,
    };
    assert.equal(jordan.country_code, 'JO');
    assert.equal(jordan.radar_hour_price, 1);
  });
});

