import * as yup from 'yup';
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js/min';

// The subset of next-intl's `useTranslations()` return value these schemas need.
// Kept as a plain function type (instead of importing next-intl's own type) so
// this file — which isn't a component and can't call the hook itself — stays
// decoupled from the translation library; callers pass in whatever `t()` they
// already have from `useTranslations('captainOnboarding.validation')`.
export type CaptainValidationT = (key: string, values?: Record<string, string | number>) => string;

export const NAME_REGEX = /^[؀-ۿa-zA-Z\s]{3,50}$/;
export const ENTITY_NAME_REGEX = /^[؀-ۿa-zA-Z0-9\s\-&.]{2,60}$/;
export const VEHICLE_MAKE_REGEX = /^[؀-ۿa-zA-Z\s]{2,30}$/;
export const VEHICLE_MODEL_REGEX = /^[؀-ۿa-zA-Z0-9\s\-&.]{2,40}$/;
export const SIDE_ID_REGEX = /^[A-Za-z0-9؀-ۿ-]{2,15}$/;
// Plate formats vary a lot by country (digits, Arabic/Latin letters, dashes,
// spaces), so this only rejects garbage/empty input rather than enforcing one
// specific layout like "77-12345".
export const PLATE_REGEX = /^[A-Za-z0-9؀-ۿ\s-]{3,15}$/;
export const VEHICLE_COLOR_REGEX = /^[؀-ۿa-zA-Z\s]{2,30}$/;
export const NATIONAL_ID_NUMBER_REGEX = /^[A-Za-z0-9؀-ۿ]{5,20}$/;
export const LICENSE_NUMBER_REGEX = /^[A-Za-z0-9؀-ۿ]{3,20}$/;
export const SOCIAL_URL_REGEX = /^https?:\/\/[^\s]+$/i;
export const VEHICLE_YEAR_MIN = 1990;
export const VEHICLE_YEAR_MAX = 2027;

// A phone typed in local format (e.g. "01159133110") is only valid relative to a
// country, so `country` is required here — either from a sibling schema field
// (personal step, via `this.parent`) or a fixed value the caller already knows
// (vehicle step's office phone, which has no country field of its own).
function isValidInternationalPhone(value: string | undefined, country?: string) {
  if (!value) return false;
  try {
    return isValidPhoneNumber(value, country as CountryCode | undefined);
  } catch {
    return false;
  }
}

// A local-format number (no leading "+") can look "valid" here because
// `isValidPhoneNumber` interprets it relative to the selected country — but the
// actual sign-up call sends the raw string, which then fails a stricter,
// unrelated regex that does require a "+". Require it up front so this step's
// validation can't pass on input that sign-up will reject moments later.
function hasCountryCodePrefix(value: string | undefined) {
  return Boolean(value && value.trim().startsWith('+'));
}

export function getCaptainPersonalSchema(t: CaptainValidationT) {
  return yup.object({
    name: yup.string().trim().matches(NAME_REGEX, t('nameInvalid')).required(t('nameRequired')),
    // Optional: shown to riders instead of the legal name when set.
    nickname: yup.string().trim(),
    email: yup
      .string()
      .trim()
      .test('is-valid-email', t('emailInvalid'), (value) => {
        if (!value) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }),
    phone: yup
      .string()
      .trim()
      .required(t('phoneRequired'))
      .test('is-valid-phone', t('phoneInvalid'), function testPhone(value) {
        if (!hasCountryCodePrefix(value)) {
          return this.createError({ message: t('phoneMissingCountryCode') });
        }
        const countryIso = (this.parent as { countryIso?: string } | undefined)?.countryIso;
        return isValidInternationalPhone(value, countryIso);
      }),
    password: yup.string().min(6, t('passwordMin')).required(t('passwordRequired')),
    country: yup.string().required(t('countryRequired')),
    governorate: yup.string().required(t('governorateRequired')),
    district: yup.string().required(t('districtRequired')),
  });
}

export function getCaptainTaxiVehicleSchema(t: CaptainValidationT, country?: string) {
  return yup.object({
    officeName: yup.string().trim().matches(ENTITY_NAME_REGEX, t('officeNameInvalid')).required(t('officeNameRequired')),
    officePhone: yup
      .string()
      .trim()
      .required(t('officePhoneRequired'))
      .test('is-valid-phone', t('phoneInvalid'), function testOfficePhone(value) {
        if (!hasCountryCodePrefix(value)) {
          return this.createError({ message: t('phoneMissingCountryCode') });
        }
        return isValidInternationalPhone(value, country);
      }),
    sideId: yup.string().trim().matches(SIDE_ID_REGEX, t('sideIdInvalid')).required(t('sideIdRequired')),
    make: yup.string().trim().matches(VEHICLE_MAKE_REGEX, t('makeInvalid')).required(t('makeRequired')),
    model: yup.string().trim().matches(VEHICLE_MODEL_REGEX, t('modelInvalid')).required(t('modelRequired')),
    plate: yup.string().trim().matches(PLATE_REGEX, t('plateInvalid')).required(t('plateRequired')),
    year: yup
      .number()
      .typeError(t('yearType'))
      .min(VEHICLE_YEAR_MIN, t('yearMin', { min: VEHICLE_YEAR_MIN }))
      .max(VEHICLE_YEAR_MAX, t('yearMax', { max: VEHICLE_YEAR_MAX }))
      .required(t('yearRequired')),
    nationalIdNumber: yup.string().trim().matches(NATIONAL_ID_NUMBER_REGEX, t('nationalIdNumberInvalid')).required(t('nationalIdNumberRequired')),
    licenseNumber: yup.string().trim().matches(LICENSE_NUMBER_REGEX, t('licenseNumberInvalid')).required(t('licenseNumberRequired')),
    facebookUrl: yup.string().trim().test('facebook-url', t('facebookInvalid'), (value) => !value || SOCIAL_URL_REGEX.test(value)),
    instagramUrl: yup.string().trim().test('instagram-url', t('instagramInvalid'), (value) => !value || SOCIAL_URL_REGEX.test(value)),
  });
}

export function getCaptainSmartAppVehicleSchema(t: CaptainValidationT) {
  return yup.object({
    companyName: yup.string().trim().matches(ENTITY_NAME_REGEX, t('companyNameInvalid')).required(t('companyNameRequired')),
    companyCode: yup.string().trim().required(t('companyCodeRequired')),
    make: yup.string().trim().matches(VEHICLE_MAKE_REGEX, t('makeInvalid')).required(t('makeRequired')),
    model: yup.string().trim().matches(VEHICLE_MODEL_REGEX, t('modelInvalid')).required(t('modelRequired')),
    color: yup.string().trim().matches(VEHICLE_COLOR_REGEX, t('colorInvalid')).required(t('colorRequired')),
    plate: yup.string().trim().matches(PLATE_REGEX, t('plateInvalid')).required(t('plateRequired')),
    year: yup
      .number()
      .typeError(t('yearType'))
      .min(VEHICLE_YEAR_MIN, t('yearMin', { min: VEHICLE_YEAR_MIN }))
      .max(VEHICLE_YEAR_MAX, t('yearMax', { max: VEHICLE_YEAR_MAX }))
      .required(t('yearRequired')),
    nationalIdNumber: yup.string().trim().matches(NATIONAL_ID_NUMBER_REGEX, t('nationalIdNumberInvalid')).required(t('nationalIdNumberRequired')),
    licenseNumber: yup.string().trim().matches(LICENSE_NUMBER_REGEX, t('licenseNumberInvalid')).required(t('licenseNumberRequired')),
    facebookUrl: yup.string().trim().test('facebook-url', t('facebookInvalid'), (value) => !value || SOCIAL_URL_REGEX.test(value)),
    instagramUrl: yup.string().trim().test('instagram-url', t('instagramInvalid'), (value) => !value || SOCIAL_URL_REGEX.test(value)),
  });
}
