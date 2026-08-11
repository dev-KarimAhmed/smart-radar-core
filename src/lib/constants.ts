export interface SovereignPricingPackage {
  id: string;
  name: string;
  pricePerImpression: number;
  isRetention: boolean;
  description: string;
}

export const SOVEREIGN_PRICING_PACKAGES: SovereignPricingPackage[] = [
  {
    id: 'basic-pulse',
    name: 'باقة البداية',
    pricePerImpression: 0.05,
    isRetention: false,
    description: 'تغطية محلية مناسبة لتجربة الإعلان وقياس الاهتمام.'
  },
  {
    id: 'immortal-heart',
    name: 'باقة الحفظ في المفضلة',
    pricePerImpression: 0.07,
    isRetention: true,
    description: 'تتيح للمستخدمين حفظ إعلانك والرجوع إليه لاحقاً.'
  },
  {
    id: 'broad-sweep',
    name: 'باقة الانتشار',
    pricePerImpression: 0.09,
    isRetention: true,
    description: 'ظهور أعلى للإعلان مع دعم الحفظ في المفضلة.'
  }
];

export const JORDAN_DISTRICTS = [
  { name: "لواء الجامعة", hex: "892f1a141b2ffff", gateway: "CliQ & Zain Cash" },
  { name: "لواء قصبة عمان", hex: "892f1a141a7ffff", gateway: "CliQ & Orange Money" },
  { name: "لواء وادي السير", hex: "892f1a141b4ffff", gateway: "CliQ & UWallet" },
  { name: "لواء ناعور", hex: "892f1a141b7ffff", gateway: "Zain Cash & Visa" },
  { name: "لواء ماركا", hex: "892f1a141a0ffff", gateway: "CliQ & eFAWATEERcom" },
  { name: "لواء سحاب", hex: "892f1a1458bffff", gateway: "CliQ & Zain Cash" },
] as const;

export const SOVEREIGN_PAYMENT_CHANNELS = [
  { id: 'cliq', name: 'CliQ الأردني', label: 'CliQ العاجل' },
  { id: 'zain', name: 'Zain Cash', label: 'محفظة Zain Cash' },
  { id: 'orange', name: 'Orange Money', label: 'أورنج ماني' },
  { id: 'efawateer', name: 'eFAWATEERcom', label: 'إي فواتيركم' }
] as const;

