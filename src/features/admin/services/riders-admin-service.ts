import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { requestTranslation } from '@/shared/utils/notification-i18n';
import type { RiderUser } from '@/features/admin/types/rider-management';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';

export interface FetchRidersResponse {
  users: RiderUser[];
  geo: GeoLookup;
}

export async function fetchRidersData(): Promise<FetchRidersResponse> {
  const res = await adminFetch('/api/admin/users?role=RIDER');
  const data = await res.json();
  if (!res.ok || !data?.success || !Array.isArray(data.users)) {
    throw new Error(data?.error || 'Failed to fetch riders data');
  }
  return {
    users: data.users,
    geo: {
      countries: Array.isArray(data.geo?.countries) ? data.geo.countries : [],
      governorates: Array.isArray(data.geo?.governorates) ? data.geo.governorates : [],
      districts: Array.isArray(data.geo?.districts) ? data.geo.districts : [],
    },
  };
}

export async function executeRiderAdminAction(
  payload: Record<string, any>
): Promise<{ success: boolean; message?: string }> {
  const res = await adminFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error || 'Failed to execute rider admin action');
  }
  return result;
}

export async function translateNotificationContent(
  title: string,
  body: string
): Promise<{ titleEn: string; bodyEn: string }> {
  const [titleEn, bodyEn] = await Promise.all([
    title.trim() ? requestTranslation(title.trim(), 'en') : Promise.resolve(''),
    body.trim() ? requestTranslation(body.trim(), 'en') : Promise.resolve(''),
  ]);
  return { titleEn, bodyEn };
}

