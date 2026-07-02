export type JordanGovernorateId =
  | 'amman'
  | 'irbid'
  | 'zarqa'
  | 'balqa'
  | 'aqaba'
  | 'madaba'
  | 'karak'
  | 'maan'
  | 'tafilah'
  | 'ajloun'
  | 'jerash'
  | 'mafraq';

export interface JordanDistrictDestination {
  id: string;
  governorateId: JordanGovernorateId;
  governorateAr: string;
  governorateEn: string;
  districtAr: string;
  districtEn: string;
  anchor: {
    lat: number;
    lng: number;
  };
  tortuosityFactor: number;
}

export const AMMAN_FALLBACK_LOCATION = {
  lat: 31.9539,
  lng: 35.9106,
};

export const JORDAN_GOVERNORATES: Array<{
  id: JordanGovernorateId;
  nameAr: string;
  nameEn: string;
}> = [
  { id: 'amman', nameAr: 'عمّان', nameEn: 'Amman' },
  { id: 'irbid', nameAr: 'إربد', nameEn: 'Irbid' },
  { id: 'zarqa', nameAr: 'الزرقاء', nameEn: 'Zarqa' },
  { id: 'balqa', nameAr: 'البلقاء', nameEn: 'Balqa' },
  { id: 'aqaba', nameAr: 'العقبة', nameEn: 'Aqaba' },
  { id: 'madaba', nameAr: 'مادبا', nameEn: 'Madaba' },
  { id: 'karak', nameAr: 'الكرك', nameEn: 'Karak' },
  { id: 'maan', nameAr: 'معان', nameEn: "Ma'an" },
  { id: 'tafilah', nameAr: 'الطفيلة', nameEn: 'Tafilah' },
  { id: 'ajloun', nameAr: 'عجلون', nameEn: 'Ajloun' },
  { id: 'jerash', nameAr: 'جرش', nameEn: 'Jerash' },
  { id: 'mafraq', nameAr: 'المفرق', nameEn: 'Mafraq' },
];

export const JORDAN_DISTRICT_DESTINATIONS: JordanDistrictDestination[] = [
  district('amman', 'عمّان', 'Amman', 'قصبة عمّان', 'Amman Qasabah', 31.9539, 35.9106, 1.35),
  district('amman', 'عمّان', 'Amman', 'الجامعة', 'University District', 32.0138, 35.8737, 1.34),
  district('amman', 'عمّان', 'Amman', 'القويسمة', 'Al Qweismeh', 31.917, 35.949, 1.35),
  district('amman', 'عمّان', 'Amman', 'ماركا', 'Marka', 31.976, 35.991, 1.36),
  district('amman', 'عمّان', 'Amman', 'الجيزة', 'Al Jizah', 31.700, 35.950, 1.24),
  district('amman', 'عمّان', 'Amman', 'الموقر', 'Al Muwaqqar', 31.815, 36.108, 1.22),
  district('amman', 'عمّان', 'Amman', 'ناعور', 'Naour', 31.874, 35.824, 1.30),
  district('amman', 'عمّان', 'Amman', 'سحاب', 'Sahab', 31.872, 36.006, 1.28),
  district('amman', 'عمّان', 'Amman', 'وادي السير', 'Wadi Al Seer', 31.9586, 35.8684, 1.37),

  district('irbid', 'إربد', 'Irbid', 'قصبة إربد', 'Irbid Qasabah', 32.5556, 35.8500, 1.31),
  district('irbid', 'إربد', 'Irbid', 'الرمثا', 'Ramtha', 32.559, 36.006, 1.26),
  district('irbid', 'إربد', 'Irbid', 'بني كنانة', 'Bani Kinanah', 32.638, 35.792, 1.30),
  district('irbid', 'إربد', 'Irbid', 'الأغوار الشمالية', 'Northern Ghor', 32.385, 35.599, 1.24),
  district('irbid', 'إربد', 'Irbid', 'الكورة', 'Koura', 32.482, 35.683, 1.31),
  district('irbid', 'إربد', 'Irbid', 'المزار الشمالي', 'Northern Mazar', 32.470, 35.815, 1.29),
  district('irbid', 'إربد', 'Irbid', 'الطيبة', 'Taybeh', 32.545, 35.717, 1.30),
  district('irbid', 'إربد', 'Irbid', 'الوسطية', 'Wasatiyah', 32.475, 35.832, 1.30),
  district('irbid', 'إربد', 'Irbid', 'بني عبيد', 'Bani Obeid', 32.543, 35.906, 1.29),

  district('zarqa', 'الزرقاء', 'Zarqa', 'قصبة الزرقاء', 'Zarqa Qasabah', 32.0728, 36.0870, 1.34),
  district('zarqa', 'الزرقاء', 'Zarqa', 'الرصيفة', 'Russeifa', 32.0178, 36.0450, 1.35),
  district('zarqa', 'الزرقاء', 'Zarqa', 'الهاشمية', 'Hashemiyah', 32.098, 36.108, 1.28),

  district('balqa', 'البلقاء', 'Balqa', 'قصبة السلط', 'Salt Qasabah', 32.0392, 35.7272, 1.35),
  district('balqa', 'البلقاء', 'Balqa', 'الشونة الجنوبية', 'Southern Shuna', 31.891, 35.617, 1.22),
  district('balqa', 'البلقاء', 'Balqa', 'دير علا', 'Deir Alla', 32.195, 35.621, 1.23),
  district('balqa', 'البلقاء', 'Balqa', 'عين الباشا', 'Ain Al Basha', 32.059, 35.832, 1.31),
  district('balqa', 'البلقاء', 'Balqa', 'ماحص والفحيص', 'Mahis and Fuheis', 32.012, 35.770, 1.34),

  district('aqaba', 'العقبة', 'Aqaba', 'قصبة العقبة', 'Aqaba Qasabah', 29.5267, 35.0078, 1.24),
  district('aqaba', 'العقبة', 'Aqaba', 'القويرة', 'Quweira', 29.800, 35.314, 1.18),

  district('madaba', 'مادبا', 'Madaba', 'قصبة مادبا', 'Madaba Qasabah', 31.7195, 35.7933, 1.28),
  district('madaba', 'مادبا', 'Madaba', 'ذيبان', 'Dhiban', 31.499, 35.782, 1.24),

  district('karak', 'الكرك', 'Karak', 'قصبة الكرك', 'Karak Qasabah', 31.180, 35.704, 1.34),
  district('karak', 'الكرك', 'Karak', 'المزار الجنوبي', 'Southern Mazar', 31.067, 35.694, 1.32),
  district('karak', 'الكرك', 'Karak', 'القصر', 'Al Qasr', 31.319, 35.743, 1.30),
  district('karak', 'الكرك', 'Karak', 'الأغوار الجنوبية', 'Southern Ghor', 31.023, 35.482, 1.20),
  district('karak', 'الكرك', 'Karak', 'عي', 'Ayy', 31.134, 35.643, 1.33),
  district('karak', 'الكرك', 'Karak', 'فقوع', 'Faqqu', 31.376, 35.700, 1.30),
  district('karak', 'الكرك', 'Karak', 'القطرانة', 'Qatraneh', 31.250, 36.049, 1.19),
  district('karak', 'الكرك', 'Karak', 'مؤاب', 'Moab', 31.167, 35.758, 1.29),

  district('maan', 'معان', "Ma'an", 'قصبة معان', "Ma'an Qasabah", 30.192, 35.734, 1.22),
  district('maan', 'معان', "Ma'an", 'البتراء', 'Petra', 30.328, 35.444, 1.35),
  district('maan', 'معان', "Ma'an", 'الحسينية', 'Husseiniya', 30.590, 35.797, 1.18),
  district('maan', 'معان', "Ma'an", 'الشوبك', 'Shobak', 30.521, 35.569, 1.31),

  district('tafilah', 'الطفيلة', 'Tafilah', 'قصبة الطفيلة', 'Tafilah Qasabah', 30.8375, 35.6044, 1.33),
  district('tafilah', 'الطفيلة', 'Tafilah', 'الحسا', 'Hasa', 30.824, 35.974, 1.20),
  district('tafilah', 'الطفيلة', 'Tafilah', 'بصيرا', 'Busaira', 30.735, 35.607, 1.32),

  district('ajloun', 'عجلون', 'Ajloun', 'قصبة عجلون', 'Ajloun Qasabah', 32.333, 35.752, 1.36),
  district('ajloun', 'عجلون', 'Ajloun', 'كفرنجة', 'Kufranjah', 32.300, 35.697, 1.35),

  district('jerash', 'جرش', 'Jerash', 'قصبة جرش', 'Jerash Qasabah', 32.2747, 35.8961, 1.32),

  district('mafraq', 'المفرق', 'Mafraq', 'قصبة المفرق', 'Mafraq Qasabah', 32.3429, 36.2080, 1.25),
  district('mafraq', 'المفرق', 'Mafraq', 'البادية الشمالية', 'Northern Badia', 32.500, 36.700, 1.15),
  district('mafraq', 'المفرق', 'Mafraq', 'البادية الشمالية الغربية', 'North Western Badia', 32.480, 36.250, 1.17),
  district('mafraq', 'المفرق', 'Mafraq', 'الرويشد', 'Ruwaished', 32.501, 38.201, 1.12),
  district('mafraq', 'المفرق', 'Mafraq', 'بلعما', 'Balama', 32.236, 36.090, 1.23),
];

export function getJordanDistrictsByGovernorate(governorateId: JordanGovernorateId) {
  return JORDAN_DISTRICT_DESTINATIONS.filter((destination) => destination.governorateId === governorateId);
}

export function getJordanDestinationById(id: string) {
  return JORDAN_DISTRICT_DESTINATIONS.find((destination) => destination.id === id) || JORDAN_DISTRICT_DESTINATIONS[0];
}

function district(
  governorateId: JordanGovernorateId,
  governorateAr: string,
  governorateEn: string,
  districtAr: string,
  districtEn: string,
  lat: number,
  lng: number,
  tortuosityFactor: number,
): JordanDistrictDestination {
  return {
    id: `${governorateId}-${slugify(districtEn)}`,
    governorateId,
    governorateAr,
    governorateEn,
    districtAr,
    districtEn,
    anchor: { lat, lng },
    tortuosityFactor,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
