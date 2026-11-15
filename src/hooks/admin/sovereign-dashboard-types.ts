export interface DelegateData {
  id: string;
  name: string;
  phone: string;
  referralCode: string;
  referredCount: number;
  deletionRate: number;
  revivalRate: number;
  pendingDues: number;
  status: 'active' | 'suspended';
  createdAt: string;
  dueDate?: string;
}

export interface DriverData {
  uid: string;
  name: string;
  phone: string;
  rating?: number;
  heartCount?: number;
  paidHoursRemaining?: number;
  status?: string;
  isBanned?: boolean;
  immunityScore?: number;
  currentDistrict?: string;
}

export const CONSTANTS = Object.freeze({
  STABILITY_THRESHOLD_MS: 30 * 24 * 60 * 60 * 1000,
  PENALTY_FACTOR: 0.40,
});

