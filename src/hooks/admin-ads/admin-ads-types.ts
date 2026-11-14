export interface SovereignAd {
  id: string;
  serial_id?: string;
  status: 'active' | 'paused' | 'archived' | 'frozen' | 'ACTIVE' | 'PENDING' | 'REJECTED' | 'FROZEN' | string;
  content?: {
    title: string;
    description: string;
    posterUrl: string;
  };
  title?: string;
  description?: string;
  posterUrl?: string;
  phone?: string;
  whatsapp?: string;
  geoLoc?: string;
  targetDistrict?: string;
  targetGovernorate?: string;
  currentImpressions?: number;
  targetImpressions?: number;
  clicksCount?: number;
  role?: string;
  endDate?: string;
  createdAt?: any;
  isPremiumRetentionPaid?: boolean;
  expirationTimestamp?: number;
  adType?: string;
  isSovereignStopped?: boolean;
  rejectionReason?: string;
  packageId?: string;
  geo?: {
    governorate?: string;
    district?: string;
  };
}

export interface AdInput {
  title: string;
  description: string;
  posterUrl: string;
  actionUrl?: string;
  targetDistrict?: string;
  targetGovernorate?: string;
  targetImpressions: number;
  phone?: string;
  whatsapp?: string;
  geoLoc?: string;
  buttonText?: string;
  isPremiumRetentionPaid?: boolean;
  expirationTimestamp?: number;
  adType?: string;
  status?: string;
  packageId?: string;
  endDate?: string;
  role?: string;
}
