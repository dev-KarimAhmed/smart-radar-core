export {
  type CanonicalLocationEntry,
  normalizeArabicText,
  normalizeEnglishText,
  hasArabicLetters,
  hasLatinLetters,
  transliterateArabic,
} from './location/location-text-utils';

export {
  JORDAN_GOVERNORATE_ENTRIES,
  EGYPT_GOVERNORATE_ENTRIES,
  ALL_GOVERNORATES,
} from './location/governorates-catalog';

export {
  DISTRICT_STEM_MAP,
  translateArabicDistrict,
} from './location/districts-catalog';

export {
  findCanonicalGovernorate,
  resolveGovernorateLabel,
  resolveDistrictLabel,
  resolveLocationLabel,
} from './location/location-resolvers';

export {
  canonicalizeGovernorateRows,
  canonicalizeDistrictRows,
} from './location/location-canonicalizers';
