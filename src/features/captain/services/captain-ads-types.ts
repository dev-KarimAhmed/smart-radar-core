export interface CaptainAdItem {
  id: string;
  captainId: string;
  seatNumber: number;
  seatLabel: string;
  imageUrl: string;
  caption?: string;
  createdAt: number;
  updatedAt: number;
  status: 'ACTIVE' | 'PAUSED';
}

export interface AdValidationResult {
  valid: boolean;
  error?: string;
}

export interface CaptainAdPackage {
  packageId: 'PACKAGE_A';
  packageNameAr: string;
  packageNameEn: string;
  status: 'ACTIVE' | 'EXPIRED' | 'UNSUBSCRIBED';
  durationDays: number;
  maxAds: number;
  coverageMeters: number;
  priceJOD?: number;
  subscribedAt?: string;
  expiresAt?: string;
}

export const AD_PACKAGE_A_DETAILS: CaptainAdPackage = {
  packageId: 'PACKAGE_A',
  packageNameAr: 'الباقة الافتتاحية',
  packageNameEn: 'Launch Package',
  status: 'UNSUBSCRIBED',
  durationDays: 30,
  maxAds: 4,
  coverageMeters: 500,
  priceJOD: 0,
};
