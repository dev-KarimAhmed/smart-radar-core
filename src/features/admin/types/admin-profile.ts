import { AdminSectorId } from '../lib/admin-permissions';

export const PRIMARY_SOVEREIGN_ADMIN_ID = '70b4a26f-10ac-4888-8df6-c3a5ad824b8a';
export const PRIMARY_SOVEREIGN_ADMIN_PHONE = '+201551981922';

export interface AdminProfile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  status: string;
  created_at: string;
  admin_rank?: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  admin_rank_label?: string;
  allowed_sectors?: AdminSectorId[];
  is_primary?: boolean;
}

