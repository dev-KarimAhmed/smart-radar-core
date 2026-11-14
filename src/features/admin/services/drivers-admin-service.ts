import { adminFetch } from '@/features/admin/lib/admin-api-client';
import type { CaptainUser, WelcomeHoursConfig } from '@/features/admin/types/driver-management';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';

export interface FetchCaptainsResult {
  users: CaptainUser[];
  geo?: GeoLookup;
}

export async function fetchCaptainsData(): Promise<FetchCaptainsResult> {
  const res = await adminFetch('/api/admin/users?role=CAPTAIN');
  const data = await res.json();
  if (!res.ok || !data?.success || !Array.isArray(data.users)) {
    throw new Error(data?.error || 'Failed to fetch captains data');
  }
  return {
    users: data.users,
    geo: data.geo
      ? {
          countries: Array.isArray(data.geo.countries) ? data.geo.countries : [],
          governorates: Array.isArray(data.geo.governorates) ? data.geo.governorates : [],
          districts: Array.isArray(data.geo.districts) ? data.geo.districts : [],
        }
      : undefined,
  };
}

export async function executeCaptainAction(payload: Record<string, any>): Promise<string> {
  const res = await adminFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to execute captain action');
  }
  return data.message || 'Action executed successfully';
}

export async function fetchWelcomeHoursConfig(): Promise<WelcomeHoursConfig> {
  const res = await adminFetch('/api/admin/welcome-hours');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to fetch welcome hours config');
  }
  return {
    enabled: Boolean(data.enabled),
    hours: Number(data.hours ?? 20),
    minutes: Number(data.minutes ?? 1200),
    validityDays: Number(data.validityDays ?? 30),
  };
}

export async function saveWelcomeHoursConfig(config: {
  enabled: boolean;
  hours: number;
  validityDays: number;
}): Promise<string> {
  const res = await adminFetch('/api/admin/welcome-hours', {
    method: 'POST',
    body: JSON.stringify({
      action: 'update_settings',
      ...config,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to save welcome hours config');
  }
  return data.message || 'Settings saved successfully';
}

export async function applyWelcomeHoursToExisting(params: {
  hours: number;
  validityDays: number;
}): Promise<{ message: string; count: number }> {
  const res = await adminFetch('/api/admin/welcome-hours', {
    method: 'POST',
    body: JSON.stringify({
      action: 'apply_to_existing',
      ...params,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to apply welcome hours to existing captains');
  }
  return {
    message: data.message || 'Applied successfully',
    count: data.count || 0,
  };
}

export async function updateCaptainLanguage(captainId: string, language: string): Promise<string> {
  const res = await adminFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      action: 'update_language',
      userId: captainId,
      language,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update captain language');
  }
  return data.message || 'Language updated';
}

