export interface GeoCountry {
  id: number;
  name_ar: string;
  country_code?: string;
}

export interface GeoGovernorate {
  id: number;
  name_ar: string;
  country_id: number;
}

export interface GeoDistrict {
  id: number;
  name_ar: string;
  governorate_id: number;
}

export interface GeoLookup {
  countries: GeoCountry[];
  governorates: GeoGovernorate[];
  districts: GeoDistrict[];
}

export interface GeoFilterBarProps {
  geoLookup: GeoLookup;
  selectedCountry: string;
  selectedGovernorate: string;
  selectedDistrict: string;
  onCountryChange: (val: string) => void;
  onGovernorateChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
  onResetGeo: () => void;
  isArabic?: boolean;
  className?: string;
}

export const getCountryFlag = (country?: { name_ar?: string; country_code?: string } | null) => {
  if (!country) return '📍';
  const code = (country.country_code || '').toUpperCase();
  const name = country.name_ar || '';
  if (code === 'JO' || name.includes('أردن') || name.includes('Jordan')) return '🇯🇴';
  if (code === 'EG' || name.includes('مصر') || name.includes('Egypt')) return '🇪🇬';
  if (code === 'SA' || name.includes('سعودية')) return '🇸🇦';
  return '📍';
};
