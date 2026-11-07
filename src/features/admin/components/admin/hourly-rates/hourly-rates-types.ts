export interface CountryItem {
  id: number;
  country_code: string;
  name_ar: string;
  name_en: string;
  currency_ar: string;
  currency_en: string;
  radar_hour_price: number;
}

export interface GovernorateItem {
  id: number;
  name_ar: string;
  name_en: string;
  country_id: number;
}

export interface DistrictItem {
  id: number;
  name_ar: string;
  name_en: string;
  governorate_id: number;
}

export interface CustomRatesMatrix {
  governorates: Record<string, number>;
  districts: Record<string, number>;
}
