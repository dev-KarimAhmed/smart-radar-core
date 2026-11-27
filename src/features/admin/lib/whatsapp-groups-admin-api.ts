import type {
  AdminWhatsAppGroupsResponse,
  CreateWhatsAppGroupPayload,
  ToggleWhatsAppGroupStatusPayload,
  UnlinkWhatsAppGroupOwnerPayload,
  UnlinkWhatsAppGroupOwnerResponse,
} from '@/features/whatsapp-groups/contract';
import { adminFetch } from './admin-api-client';
import {
  createPreviewWhatsAppGroup,
  getPreviewWhatsAppGroupsResponse,
  togglePreviewWhatsAppGroup,
  unlinkPreviewWhatsAppGroup,
} from './whatsapp-groups-preview-data';

export const ADMIN_WHATSAPP_GROUPS_ENDPOINT = '/api/admin/whatsapp-groups';

export type AdminFetchLike = typeof adminFetch;

export interface CreateWhatsAppGroupResult {
  groupCode?: string;
}

export class AdminWhatsAppGroupsApiError extends Error {
  errorCode?: string;
  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = 'AdminWhatsAppGroupsApiError';
    this.errorCode = errorCode;
  }
}

export interface AdminWhatsAppGroupsGateway {
  fetchGroups: (fallbackError: string) => Promise<AdminWhatsAppGroupsResponse>;
  createGroup: (payload: CreateWhatsAppGroupPayload, fallbackError: string) => Promise<CreateWhatsAppGroupResult | void>;
  toggleStatus: (payload: ToggleWhatsAppGroupStatusPayload, fallbackError: string) => Promise<void>;
  unlinkOwner: (payload: UnlinkWhatsAppGroupOwnerPayload, fallbackError: string) => Promise<UnlinkWhatsAppGroupOwnerResponse>;
}

async function parseAdminJson<T extends { success?: boolean; error?: string; errorCode?: string }>(
  res: Response,
  fallbackError: string,
): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | null;
  if (!res.ok || !data?.success) {
    throw new AdminWhatsAppGroupsApiError(data?.error || fallbackError, typeof data?.errorCode === 'string' ? data.errorCode : undefined);
  }
  return data;
}

export function createAdminWhatsAppGroupsGateway(
  fetcher: AdminFetchLike = adminFetch,
  endpoint: string = ADMIN_WHATSAPP_GROUPS_ENDPOINT,
): AdminWhatsAppGroupsGateway {
  return {
    async fetchGroups(fallbackError: string): Promise<AdminWhatsAppGroupsResponse> {
      try {
        const res = await fetcher(endpoint);
        if (res.status === 404) {
          return getPreviewWhatsAppGroupsResponse();
        }
        return await parseAdminJson<AdminWhatsAppGroupsResponse>(res, fallbackError);
      } catch {
        return getPreviewWhatsAppGroupsResponse();
      }
    },
    async createGroup(payload: CreateWhatsAppGroupPayload, fallbackError: string): Promise<CreateWhatsAppGroupResult> {
      const res = await fetcher(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 404) {
        return { groupCode: createPreviewWhatsAppGroup(payload) };
      }
      const data = await parseAdminJson<{ success?: boolean; error?: string; errorCode?: string; group?: { groupCode?: string } }>(res, fallbackError);
      return { groupCode: typeof data.group?.groupCode === 'string' ? data.group.groupCode : undefined };
    },
    async toggleStatus(payload: ToggleWhatsAppGroupStatusPayload, fallbackError: string): Promise<void> {
      const res = await fetcher(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 404) {
        togglePreviewWhatsAppGroup(payload.id, payload.status);
        return;
      }
      await parseAdminJson<{ success?: boolean; error?: string; errorCode?: string }>(res, fallbackError);
    },
    async unlinkOwner(payload: UnlinkWhatsAppGroupOwnerPayload, fallbackError: string): Promise<UnlinkWhatsAppGroupOwnerResponse> {
      const res = await fetcher(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payload.id, action: 'UNLINK_OWNER' }),
      });
      if (res.status === 404) {
        const released = unlinkPreviewWhatsAppGroup(payload.id);
        return { success: true, unlinked: true, releasedMembersCount: released };
      }
      return parseAdminJson<UnlinkWhatsAppGroupOwnerResponse>(res, fallbackError);
    },
  };
}

export const defaultAdminWhatsAppGroupsGateway: AdminWhatsAppGroupsGateway =
  createAdminWhatsAppGroupsGateway();
