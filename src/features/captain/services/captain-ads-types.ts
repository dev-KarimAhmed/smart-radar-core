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
  packageNameAr: 'باقة الخدمات / A',
  packageNameEn: 'Services Package / A',
  status: 'UNSUBSCRIBED',
  durationDays: 30,
  maxAds: 3,
  coverageMeters: 500,
  priceJOD: 10,
};
