export interface Delegate {
  id: string;
  name: string;
  phone: string;
  district: string;
  referralCode: string;
  referredCount: number;
  organicCount: number;
  churnCount: number;
  steadyCount: number;
  targetDaily: number;
  carriedDeficit: number;
  linkExpiryHours: number;
  status: 'active' | 'suspended';
  createdAt: string;
  integritySignature?: string;
  subRole?: 'independent' | 'captain';
  isFleetActive?: boolean;
}

export interface MagicLink {
  id: string;
  delegateId: string;
  delegateName: string;
  token: string;
  expiresAt: string;
  expiryHours: number;
  status: 'active' | 'revoked' | 'used';
  url: string;
}

export interface DelegateTask {
  id: string;
  delegateId: string;
  delegateName: string;
  title: string;
  description: string;
  status: 'pending' | 'acknowledged' | 'completed' | 'closed';
  createdAt: string;
  deadline: string;
}
