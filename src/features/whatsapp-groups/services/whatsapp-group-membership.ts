import { supabase } from '@/lib/supabase-client';
import type {
  ConfirmWhatsAppGroupSwitchResult,
  ConfirmWhatsAppGroupSwitchStatus,
  JoinWhatsAppGroupResult,
  JoinWhatsAppGroupStatus,
  LeaveWhatsAppGroupResult,
  WhatsAppGroupCurrentMembership,
  WhatsAppGroupLinkStatus,
  WhatsAppGroupMemberRole,
} from '../types';
import { isValidWhatsAppGroupCodeFormat, normalizeWhatsAppGroupCode } from './whatsapp-group-storage';

export interface RpcLikeClient {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }> | Promise<{ data: unknown; error: { message?: string } | null }>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asMemberRole(value: unknown): WhatsAppGroupMemberRole | undefined {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === 'CAPTAIN' || normalized === 'DRIVER') return 'CAPTAIN';
  if (normalized === 'RIDER') return 'RIDER';
  return undefined;
}

export function mapJoinWhatsAppGroupPayload(data: unknown): JoinWhatsAppGroupResult {
  const row = asRecord(data);
  if (!row) {
    return { success: false, status: 'GROUP_NOT_FOUND' };
  }
  const status = (asOptionalString(row.status) ?? 'GROUP_NOT_FOUND') as JoinWhatsAppGroupStatus;
  return {
    success: Boolean(row.success),
    status,
    groupId: asOptionalString(row.group_id),
    groupCode: asOptionalString(row.group_code),
    groupName: asOptionalString(row.group_name),
    userRole: asMemberRole(row.user_role),
    currentGroupId: asOptionalString(row.current_group_id),
    currentGroupCode: asOptionalString(row.current_group_code),
    currentGroupName: asOptionalString(row.current_group_name),
    targetGroupId: asOptionalString(row.target_group_id),
    targetGroupCode: asOptionalString(row.target_group_code),
    targetGroupName: asOptionalString(row.target_group_name),
  };
}

export function mapConfirmSwitchPayload(data: unknown): ConfirmWhatsAppGroupSwitchResult {
  const row = asRecord(data);
  if (!row) {
    return { success: false, status: 'GROUP_NOT_FOUND' };
  }
  const status = (asOptionalString(row.status) ?? 'GROUP_NOT_FOUND') as ConfirmWhatsAppGroupSwitchStatus;
  return {
    success: Boolean(row.success),
    status,
    previousGroupId: row.previous_group_id === null ? null : asOptionalString(row.previous_group_id),
    groupId: asOptionalString(row.group_id),
    groupCode: asOptionalString(row.group_code),
    groupName: asOptionalString(row.group_name),
    userRole: asMemberRole(row.user_role),
  };
}

export async function joinWhatsAppGroupByCode(
  groupCode: string,
  client: RpcLikeClient = supabase,
): Promise<JoinWhatsAppGroupResult> {
  const cleanCode = normalizeWhatsAppGroupCode(groupCode);
  if (!cleanCode) {
    return { success: false, status: 'MISSING_GROUP_CODE' };
  }
  if (!isValidWhatsAppGroupCodeFormat(cleanCode)) {
    return { success: false, status: 'GROUP_NOT_FOUND' };
  }

  const { data, error } = await client.rpc('join_whatsapp_group_by_code', {
    p_group_code: cleanCode,
  });

  if (error) {
    throw new Error(error.message || 'JOIN_WHATSAPP_GROUP_FAILED');
  }

  return mapJoinWhatsAppGroupPayload(data);
}

export async function confirmWhatsAppGroupSwitch(
  targetGroupCode: string,
  confirm: boolean,
  client: RpcLikeClient = supabase,
): Promise<ConfirmWhatsAppGroupSwitchResult> {
  const cleanCode = normalizeWhatsAppGroupCode(targetGroupCode);
  if (confirm && !cleanCode) {
    return { success: false, status: 'MISSING_GROUP_CODE' };
  }
  if (confirm && !isValidWhatsAppGroupCodeFormat(cleanCode)) {
    return { success: false, status: 'GROUP_NOT_FOUND' };
  }

  const { data, error } = await client.rpc('confirm_whatsapp_group_switch', {
    p_target_group_code: cleanCode,
    p_confirm: Boolean(confirm),
  });

  if (error) {
    throw new Error(error.message || 'CONFIRM_WHATSAPP_GROUP_SWITCH_FAILED');
  }

  return mapConfirmSwitchPayload(data);
}

export function mapLeaveWhatsAppGroupPayload(data: unknown): LeaveWhatsAppGroupResult {
  const row = asRecord(data);
  if (!row) {
    return { success: false, status: 'AUTHENTICATION_REQUIRED' };
  }
  const rawStatus = asOptionalString(row.status);
  const status: LeaveWhatsAppGroupResult['status'] =
    rawStatus === 'LEFT_GROUP' || rawStatus === 'NO_ACTIVE_MEMBERSHIP'
      ? rawStatus
      : 'AUTHENTICATION_REQUIRED';
  return {
    success: Boolean(row.success),
    status,
    removedGroupId: asOptionalString(row.removed_group_id),
  };
}

export async function leaveWhatsAppGroup(
  client: RpcLikeClient = supabase,
): Promise<LeaveWhatsAppGroupResult> {
  const { data, error } = await client.rpc('leave_whatsapp_group');

  if (error) {
    throw new Error(error.message || 'LEAVE_WHATSAPP_GROUP_FAILED');
  }

  return mapLeaveWhatsAppGroupPayload(data);
}

export interface MembershipQueryClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
      };
    };
  };
}

export function mapCurrentMembershipPayload(data: unknown): WhatsAppGroupCurrentMembership | null {
  const row = asRecord(data);
  if (!row) return null;
  const groupId = asOptionalString(row.group_id);
  const userRole = asMemberRole(row.user_role);
  if (!groupId || !userRole) return null;

  const rawLink = Array.isArray(row.whatsapp_group_links)
    ? asRecord(row.whatsapp_group_links[0])
    : asRecord(row.whatsapp_group_links);
  const rawStatus = String(rawLink?.status ?? 'ACTIVE').trim().toUpperCase();
  const groupStatus: WhatsAppGroupLinkStatus = rawStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  return {
    groupId,
    groupCode: asOptionalString(rawLink?.group_code) ?? '',
    groupName: asOptionalString(rawLink?.group_name) ?? '',
    groupStatus,
    userRole,
    joinedAt: asOptionalString(row.joined_at) ?? '',
  };
}

export async function getMyWhatsAppGroupMembership(
  userId: string,
  client: MembershipQueryClient = supabase as unknown as MembershipQueryClient,
): Promise<WhatsAppGroupCurrentMembership | null> {
  const cleanUid = String(userId || '').trim();
  if (!cleanUid) return null;

  const { data, error } = await client
    .from('whatsapp_group_memberships')
    .select('group_id, user_role, joined_at, whatsapp_group_links(id, group_code, group_name, status)')
    .eq('user_id', cleanUid)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'GET_WHATSAPP_GROUP_MEMBERSHIP_FAILED');
  }

  return mapCurrentMembershipPayload(data);
}
