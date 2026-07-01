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
    name: 'باقة نبض الاختبار الأساسي ⚙️',
    pricePerImpression: 0.05,
    isRetention: false,
    description: 'تغطية محلية قياسية وممتازة للتجربة واختبار السوق بالبث العشوائي المتزن.'
  },
  {
    id: 'immortal-heart',
    name: 'باقة التخليد والقلب الأخضر 💚',
    pricePerImpression: 0.07,
    isRetention: true,
    description: 'تمكّن المستهلكين من حبس وحفظ إعلانك في الذاكرة المحلية لأجهزتهم للأبد كمرجع دائم.'
  },
  {
    id: 'broad-sweep',
    name: 'باقة الاكتساح والانتشار السيادي 👑',
    pricePerImpression: 0.09,
    isRetention: true,
    description: 'بث مكثف عالي الأولوية مع تفعيل احتفاظ المستهلك الدائم ورتبة المعلن الوفي المعتمد.'
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

