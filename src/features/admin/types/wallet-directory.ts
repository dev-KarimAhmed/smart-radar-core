export interface PaymentTransferChannel {
  id: string;
  nameAr: string;
  nameEn: string;
  accountNumber: string;
  accountHolder?: string;
  descriptionAr: string;
  descriptionEn?: string;
  countryId?: number | null; // null = all countries, 1 = Jordan, 2 = Egypt
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialDelegate {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  countryId?: number | null;
  governorateId?: number | null;
  governorateName?: string;
  districtId?: number | null;
  districtName?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_TRANSFER_CHANNELS: PaymentTransferChannel[] = [
  {
    id: 'cliq',
    nameAr: 'كليك (CliQ)',
    nameEn: 'CliQ',
    accountNumber: 'BYNCOM1',
    accountHolder: 'شركة بينكم لنقل الركاب',
    descriptionAr: 'تحويل فوري باسم الحساب (Alias) بدون عمولات بنكية',
    descriptionEn: 'Instant zero-fee transfer to the account alias',
    countryId: 1,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'zain_cash',
    nameAr: 'زين كاش (Zain Cash)',
    nameEn: 'Zain Cash',
    accountNumber: '0790000001',
    accountHolder: 'محفظة بينكم - زين كاش',
    descriptionAr: 'تحويل فوري من محفظة زين كاش على الرقم أعلاه',
    descriptionEn: 'Send from your Zain Cash wallet to the number above',
    countryId: 1,
    isActive: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'orange_money',
    nameAr: 'أورنج موني (Orange Money)',
    nameEn: 'Orange Money',
    accountNumber: '0780000001',
    accountHolder: 'محفظة بينكم - أورنج موني',
    descriptionAr: 'تحويل فوري من محفظة أورنج موني على الرقم أعلاه',
    descriptionEn: 'Send from your Orange Money wallet to the number above',
    countryId: 1,
    isActive: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'efawateercom',
    nameAr: 'إي فواتيركم (eFawateercom)',
    nameEn: 'eFawateercom',
    accountNumber: '9200001',
    accountHolder: 'شركة بينكم',
    descriptionAr: 'ادفع عبر خدمة إي فواتيركم باستخدام رقم المفوتر أعلاه',
    descriptionEn: 'Pay via eFawateercom using the biller code above',
    countryId: 1,
    isActive: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_FINANCIAL_DELEGATES: FinancialDelegate[] = [
  {
    id: 'delegate-amman-wadi-seer',
    name: 'أبو محمد - مندوب وادي السير',
    phone: '962790000001',
    whatsapp: '962790000001',
    countryId: 1,
    governorateName: 'العاصمة عمّان',
    districtName: 'وادي السير',
    notes: 'متاح يومياً من 9 صباحاً حتى 11 مساءً للشحن النقدي المباشر',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'delegate-amman-center',
    name: 'أبو خالد - مندوب عمّان الوسط',
    phone: '962790000002',
    whatsapp: '962790000002',
    countryId: 1,
    governorateName: 'العاصمة عمّان',
    districtName: 'عمّان',
    notes: 'مكتب وسط البلد وجبل الحسين',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];
