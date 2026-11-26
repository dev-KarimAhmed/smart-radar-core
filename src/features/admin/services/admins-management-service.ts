import { adminFetch } from '../lib/admin-api-client';
import { AdminGeoScope, AdminSectorId } from '../lib/admin-permissions';

export interface CreateSubAdminPayload {
  fullName: string;
  phone: string;
  password: string;
  adminRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  allowedSectors: AdminSectorId[];
  allowedPermissions?: string[];
  geoScope?: AdminGeoScope;
}

export interface UpdateAdminPermissionsPayload {
  adminId: string;
  adminRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  allowedSectors: AdminSectorId[];
  allowedPermissions?: string[];
  geoScope?: AdminGeoScope;
}

export async function fetchAdminsList() {
  const res = await adminFetch('/api/admin/list-admins');
  return res.json();
}

export async function createSubAdmin(payload: CreateSubAdminPayload) {
  const res = await adminFetch('/api/admin/create-sub-admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateAdminPermissions(payload: UpdateAdminPermissionsPayload) {
  const res = await adminFetch('/api/admin/update-admin-permissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateAdminRank(targetAdminId: string, newRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN') {
  const res = await adminFetch('/api/admin/update-admin-rank', {
    method: 'POST',
    body: JSON.stringify({
      targetAdminId,
      newRank,
    }),
  });
  return res.json();
}

export async function deleteAdmin(targetAdminId: string) {
  const res = await adminFetch('/api/admin/delete-admin', {
    method: 'POST',
    body: JSON.stringify({
      targetAdminId,
    }),
  });
  return res.json();
}
