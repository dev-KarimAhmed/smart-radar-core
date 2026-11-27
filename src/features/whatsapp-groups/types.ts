// Neutral Stage 1 contracts for WhatsApp group special referral links.
// Strictly non-financial (Articles 18-20) and strictly isolated from individual referrals (Article 4).

export type WhatsAppGroupLinkStatus = 'ACTIVE' | 'INACTIVE';

export type WhatsAppGroupMemberRole = 'CAPTAIN' | 'RIDER';

export interface WhatsAppGroupSummary {
  id: string;
  groupCode: string;
  groupName: string;
  status: WhatsAppGroupLinkStatus;
}

export interface WhatsAppGroupTimeCounter {
  groupId: string;
  totalQualifiedSeconds: number;
  qualifiedTripsCount: number;
  updatedAt: string;
}

export type JoinWhatsAppGroupStatus =
  | 'JOINED'
  | 'ALREADY_MEMBER'
  | 'SWITCH_CONFIRMATION_REQUIRED'
  | 'GROUP_NOT_FOUND'
  | 'MISSING_GROUP_CODE'
  | 'AUTHENTICATION_REQUIRED'
  | 'PROFILE_NOT_FOUND'
  | 'ACCOUNT_RESTRICTED'
  | 'INELIGIBLE_ACCOUNT_ROLE';

export interface JoinWhatsAppGroupResult {
  success: boolean;
  status: JoinWhatsAppGroupStatus;
  groupId?: string;
  groupCode?: string;
  groupName?: string;
  userRole?: WhatsAppGroupMemberRole;
  currentGroupId?: string;
  currentGroupCode?: string;
  currentGroupName?: string;
  targetGroupId?: string;
  targetGroupCode?: string;
  targetGroupName?: string;
}

export type ConfirmWhatsAppGroupSwitchStatus =
  | 'SWITCHED_GROUP'
  | 'KEPT_CURRENT_GROUP'
  | 'GROUP_NOT_FOUND'
  | 'MISSING_GROUP_CODE'
  | 'AUTHENTICATION_REQUIRED'
  | 'ACCOUNT_RESTRICTED'
  | 'INELIGIBLE_ACCOUNT_ROLE';

export interface ConfirmWhatsAppGroupSwitchResult {
  success: boolean;
  status: ConfirmWhatsAppGroupSwitchStatus;
  previousGroupId?: string | null;
  groupId?: string;
  groupCode?: string;
  groupName?: string;
  userRole?: WhatsAppGroupMemberRole;
}

export interface LeaveWhatsAppGroupResult {
  success: boolean;
  status: 'LEFT_GROUP' | 'NO_ACTIVE_MEMBERSHIP' | 'AUTHENTICATION_REQUIRED';
  removedGroupId?: string;
}

export interface WhatsAppGroupCurrentMembership {
  groupId: string;
  groupCode: string;
  groupName: string;
  groupStatus: WhatsAppGroupLinkStatus;
  userRole: WhatsAppGroupMemberRole;
  joinedAt: string;
}

export interface AdminCaptainLookupItem {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  status: string;
  governorateId?: number | null;
  districtId?: number | null;
  governorateName?: string;
  districtName?: string;
  isRestricted?: boolean;
}

export type WhatsAppGroupZoneSortMode =
  | 'newest'
  | 'least_spread'
  | 'least_captain_ops'
  | 'least_rider_activity'
  | 'most_minutes';

export type WhatsAppGroupActivityFilter = 'ALL' | 'ZERO_MINUTES' | 'ZERO_MONTH_MINUTES' | 'MISSING_PAIR' | 'HAS_MINUTES';

export interface AdminWhatsAppGeoOption {
  id: string;
  name: string;
  governorateId?: string;
}

export interface AdminWhatsAppGeoOptions {
  governorates: AdminWhatsAppGeoOption[];
  districts: AdminWhatsAppGeoOption[];
}

export interface AdminWhatsAppGroupLinkItem {
  id: string;
  groupCode: string;
  groupName: string;
  status: WhatsAppGroupLinkStatus;
  leaderCaptainId: string;
  leaderFullName: string;
  leaderPhone: string;
  leaderRole: string;
  leaderStatus: string;
  leaderRestricted?: boolean;
  governorateId: number | null;
  governorateName: string;
  districtId: number | null;
  districtName: string;
  activeMembersCount: number;
  captainsCount: number;
  ridersCount: number;
  activeCaptainsCount: number;
  activeRidersCount: number;
  totalQualifiedSeconds: number;
  currentMonthQualifiedSeconds: number;
  currentMonthQualifiedTrips?: number;
  qualifiedTripsCount: number;
  lastQualifiedAt?: string | null;
  ownerUnlinkedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWhatsAppGroupsSummary {
  totalGroups: number;
  activeGroups: number;
  productiveActiveGroups?: number;
  inactiveGroups: number;
  totalActiveMembers: number;
  totalCaptains: number;
  totalRiders: number;
  totalActiveCaptains: number;
  totalActiveRiders: number;
  totalQualifiedSeconds: number;
  currentMonthQualifiedSeconds?: number;
  totalQualifiedTrips: number;
  currentMonthQualifiedTrips?: number;
}

export interface AdminWhatsAppGroupsResponse {
  success: boolean;
  schemaReady?: boolean;
  monthlySchemaReady?: boolean;
  activityTruncated?: boolean;
  membersTruncated?: boolean;
  periodMonth?: string;
  groups: AdminWhatsAppGroupLinkItem[];
  captains: AdminCaptainLookupItem[];
  summary: AdminWhatsAppGroupsSummary;
  geoOptions?: AdminWhatsAppGeoOptions;
  error?: string;
}

export interface CreateWhatsAppGroupPayload { groupName: string; groupCode?: string; leaderCaptainId: string; }
export interface ToggleWhatsAppGroupStatusPayload { id: string; status: WhatsAppGroupLinkStatus; }
export interface UnlinkWhatsAppGroupOwnerPayload { id: string; action: 'UNLINK_OWNER'; }
export interface UnlinkWhatsAppGroupOwnerResponse {
  success: boolean; unlinked?: boolean; groupId?: string; groupCode?: string; groupName?: string;
  ownerUnlinkedAt?: string | null; releasedMembersCount?: number; notificationDispatched?: boolean;
  error?: string; errorCode?: string;
}
export interface WhatsAppGroupLeaderLinkCounter {
  groupId: string; groupCode: string; groupName: string; status: WhatsAppGroupLinkStatus;
  currentMonthSeconds: number; currentMonthMinutes: number;
  totalQualifiedSeconds: number; totalQualifiedMinutes: number;
}
export interface WhatsAppGroupLeaderMinutes {
  isGroupLeader: boolean; periodMonth: string;
  currentMonthSeconds: number; currentMonthMinutes: number;
  totalQualifiedSeconds: number; totalQualifiedMinutes: number;
  links?: WhatsAppGroupLeaderLinkCounter[];
}

export type QualifiedTripReason =
  | 'CREDITED'
  | 'MISSING_TRIP_ID'
  | 'TRIP_NOT_FOUND'
  | 'TRIP_NOT_COMPLETED'
  | 'INVALID_TRIP_WINDOW'
  | 'ALREADY_RECORDED'
  | 'MEMBERSHIP_MISSING'
  | 'GROUP_MISMATCH'
  | 'GROUP_INACTIVE'
  | 'OVERLAPPING_TIME_ALREADY_CREDITED';

export interface QualifiedTripEvaluationResult {
  credited: boolean;
  reason: QualifiedTripReason;
  groupId?: string;
  periodMonth?: string;
  qualifiedSeconds: number;
}

export interface WhatsAppGroupSessionSnapshot {
  access_token?: string | null;
  user?: { id?: string | null } | null;
}

export interface WhatsAppGroupSessionPort {
  getSession: () => Promise<{ data: { session: WhatsAppGroupSessionSnapshot | null } }>;
  onAuthStateChange: (
    callback: (event: string, session: WhatsAppGroupSessionSnapshot | null) => void,
  ) => { data: { subscription: { unsubscribe: () => void } } };
}

export interface WhatsAppGroupBrowserAdapter {
  getSearch: () => string | null;
  getHref: () => string | null;
  replaceUrl: (url: string) => void;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}
