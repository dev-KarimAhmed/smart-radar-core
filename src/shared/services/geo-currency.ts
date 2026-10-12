import countryToCurrency from 'country-to-currency';

/** Maps an ISO 3166-1 alpha-2 country code (any case) to its ISO 4217 currency code. */
export function countryCodeToCurrency(countryCode: string | null | undefined): string | undefined {
  if (!countryCode) return undefined;
  return countryToCurrency[countryCode.toUpperCase() as keyof typeof countryToCurrency];
}
