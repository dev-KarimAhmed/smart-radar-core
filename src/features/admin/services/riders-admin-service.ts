import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { requestTranslation } from '@/shared/utils/notification-i18n';
import type { RiderUser } from '@/features/admin/types/rider-management';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';

export interface FetchRidersResponse {
  users: RiderUser[];
  totalCount?: number;
  geo: GeoLookup;
}

export interface FetchRidersParams {
  metaOnly?: boolean;
  countryId?: string;
  governorateId?: string;
  districtId?: string;
  status?: string;
  q?: string;
}

export async function fetchRidersData(params: FetchRidersParams = {}): Promise<FetchRidersResponse> {
  const qs = new URLSearchParams({ role: 'RIDER' });
  if (params.metaOnly) qs.set('metaOnly', '1');
  if (params.countryId && params.countryId !== 'ALL') qs.set('countryId', params.countryId);
  if (params.governorateId && params.governorateId !== 'ALL') qs.set('governorateId', params.governorateId);
  if (params.districtId && params.districtId !== 'ALL') qs.set('districtId', params.districtId);
  if (params.status && params.status !== 'ALL') qs.set('status', params.status);
  if (params.q && params.q.trim()) qs.set('q', params.q.trim());

  const res = await adminFetch(`/api/admin/users?${qs.toString()}`);
  const data = await res.json();
  if (!res.ok || !data?.success || !Array.isArray(data.users)) {
    throw new Error(data?.error || 'Failed to fetch riders data');
  }
  return {
    users: data.users,
    totalCount: typeof data.totalCount === 'number' ? data.totalCount : undefined,
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

