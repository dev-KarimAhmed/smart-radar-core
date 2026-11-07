import { adminFetch } from '@/features/admin/lib/admin-api-client';

export async function fetchWelcomeHoursApi() {
  const res = await adminFetch('/api/admin/welcome-hours');
  if (!res.ok) throw new Error('Failed to fetch welcome hours config');
  return await res.json();
}

export async function saveWelcomeSettingsApi(params: {
  enabled: boolean;
  hours: number;
  validityDays: number;
}) {
  const res = await adminFetch('/api/admin/welcome-hours', {
    method: 'POST',
    body: JSON.stringify({
      action: 'update_settings',
      enabled: params.enabled,
      hours: params.hours,
      validityDays: params.validityDays,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to save welcome settings');
  }
  return data;
}

export async function applyWelcomeToExistingApi(params: {
  hours: number;
  validityDays: number;
}) {
  const res = await adminFetch('/api/admin/welcome-hours', {
    method: 'POST',
    body: JSON.stringify({
      action: 'apply_to_existing',
      hours: params.hours,
      validityDays: params.validityDays,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to apply welcome hours to existing captains');
  }
  return data;
}

export async function fetchCaptainsApi() {
  const res = await adminFetch('/api/admin/users?role=CAPTAIN');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to fetch captains');
  }
  return data;
}

export async function executeCaptainAdminActionApi(payload: Record<string, any>) {
  const res = await adminFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Action failed');
  }
  return data;
}

export async function updateCaptainLanguageApi(captainId: string, nextLang: string) {
  const res = await adminFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      action: 'update_language',
      userId: captainId,
      language: nextLang,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to update captain language');
  }
  return data;
}
