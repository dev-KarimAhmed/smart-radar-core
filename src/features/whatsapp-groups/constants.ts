import type { AdminWhatsAppGroupsSummary } from './types';

export const PENDING_WHATSAPP_GROUP_CODE_KEY = 'radar_pending_whatsapp_group_code';
export const WHATSAPP_GROUP_CODE_REGEX = /^[A-Za-z0-9_-]{4,64}$/;
export const WHATSAPP_GROUP_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const EMPTY_ADMIN_GROUPS_SUMMARY: AdminWhatsAppGroupsSummary = {
  totalGroups: 0,
  activeGroups: 0,
  productiveActiveGroups: 0,
  inactiveGroups: 0,
  totalActiveMembers: 0,
  totalCaptains: 0,
  totalRiders: 0,
  totalActiveCaptains: 0,
  totalActiveRiders: 0,
  totalQualifiedSeconds: 0,
  currentMonthQualifiedSeconds: 0,
  totalQualifiedTrips: 0,
  currentMonthQualifiedTrips: 0,
};

export function normalizeWhatsAppGroupCode(code: string | null | undefined): string {
  return String(code ?? '').trim();
}

export function isValidWhatsAppGroupCodeFormat(code: string | null | undefined): boolean {
  const clean = normalizeWhatsAppGroupCode(code);
  return WHATSAPP_GROUP_CODE_REGEX.test(clean);
}
