// Static placeholder data for the captain wallet refill flow (Phase 2: Wallet & Refill Engine).
// Every value here is a stand-in for data that should eventually come from an admin-configured
// table (e.g. `payment_channels` / `district_payment_directory` in Supabase). Keeping all of it
// in this single file means swapping to a live fetch later only touches this file plus the two
// call sites in `driver-wallet-tab.tsx`, instead of hunting for scattered literals.

export interface CaptainPaymentChannel {
  id: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const CAPTAIN_PAYMENT_CHANNELS: CaptainPaymentChannel[] = [
  {
    id: 'cliq',
    labelAr: 'CliQ',
    labelEn: 'CliQ',
    descriptionAr: 'تحويل فوري باسم الحساب (Alias)',
    descriptionEn: 'Instant transfer to the account alias',
  },
  {
    id: 'zain_cash',
    labelAr: 'زين كاش',
    labelEn: 'Zain Cash',
    descriptionAr: 'حوّل من محفظة زين كاش على الرقم أدناه',
    descriptionEn: 'Send from your Zain Cash wallet to the number below',
  },
  {
    id: 'orange_money',
    labelAr: 'أورنج موني',
    labelEn: 'Orange Money',
    descriptionAr: 'حوّل من محفظة أورنج موني على الرقم أدناه',
    descriptionEn: 'Send from your Orange Money wallet to the number below',
  },
  {
    id: 'efawateercom',
    labelAr: 'إي فواتيركم',
    labelEn: 'eFawateercom',
    descriptionAr: 'ادفع عبر خدمة إي فواتيركم برقم الفوترة أدناه',
    descriptionEn: 'Pay via eFawateercom using the biller code below',
  },
];

export interface CaptainDistrictPaymentInfo {
  district: string; // must match the `district` value stored on the captain profile
  channelNumbers: Record<string, string>; // CaptainPaymentChannel.id -> number/alias/biller code
  delegateName: string;
  delegatePhone: string; // international format, no leading "+"
}

// TODO(Phase 2 backend): replace with a live lookup keyed by the captain's real `district`
// once the admin dashboard exposes per-district payment numbers and delegate assignments.
export const CAPTAIN_DISTRICT_PAYMENT_DIRECTORY: CaptainDistrictPaymentInfo[] = [
  {
    district: 'وادي السير',
    channelNumbers: {
      cliq: 'RADARWS1',
      zain_cash: '0790000001',
      orange_money: '0780000001',
      efawateercom: '9200001',
    },
    delegateName: 'أبو محمد - مندوب وادي السير',
    delegatePhone: '962790000001',
  },
  {
    district: 'عمّان',
    channelNumbers: {
      cliq: 'RADARAMM',
      zain_cash: '0790000002',
      orange_money: '0780000002',
      efawateercom: '9200002',
    },
    delegateName: 'أبو خالد - مندوب عمّان',
    delegatePhone: '962790000002',
  },
];

export const DEFAULT_DISTRICT_PAYMENT_INFO: CaptainDistrictPaymentInfo = {
  district: '',
  channelNumbers: {
    cliq: 'RADARJO',
    zain_cash: '0790000000',
    orange_money: '0780000000',
    efawateercom: '9200000',
  },
  delegateName: 'المندوب المالي العام',
  delegatePhone: '962790000000',
};

export function getCaptainDistrictPaymentInfo(district?: string | null): CaptainDistrictPaymentInfo {
  const match = district
    ? CAPTAIN_DISTRICT_PAYMENT_DIRECTORY.find((entry) => entry.district === district)
    : undefined;
  return match || { ...DEFAULT_DISTRICT_PAYMENT_INFO, district: district || DEFAULT_DISTRICT_PAYMENT_INFO.district };
}

// Quick-pick amount chips shown above the manual amount field.
export const CAPTAIN_WALLET_AMOUNT_PRESETS = [5, 10, 20] as const;
