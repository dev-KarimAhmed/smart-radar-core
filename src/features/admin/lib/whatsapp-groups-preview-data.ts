import type {
  AdminCaptainLookupItem,
  AdminWhatsAppGeoOptions,
  AdminWhatsAppGroupLinkItem,
  AdminWhatsAppGroupsResponse,
} from '@/features/whatsapp-groups/contract';
import { computeWhatsAppGroupsSummary } from '@/features/whatsapp-groups/services/whatsapp-group-zone-sorting';

const INITIAL_CAPTAINS: AdminCaptainLookupItem[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    fullName: 'أحمد محمود الخالدي',
    phone: '+962795551001',
    role: 'CAPTAIN',
    status: 'ACTIVE',
    governorateId: 1,
    districtId: 101,
    governorateName: 'عمّان',
    districtName: 'تلاع العلي',
    isRestricted: false,
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    fullName: 'طارق زياد العمري',
    phone: '+962785552002',
    role: 'CAPTAIN',
    status: 'ACTIVE',
    governorateId: 2,
    districtId: 201,
    governorateName: 'إربد',
    districtName: 'الحي الشمالي',
    isRestricted: false,
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    fullName: 'محمود حسن المصري',
    phone: '+201095553003',
    role: 'CAPTAIN',
    status: 'ACTIVE',
    governorateId: 3,
    districtId: 301,
    governorateName: 'الجيزة',
    districtName: 'المهندسين',
    isRestricted: false,
  },
];

const INITIAL_GEO: AdminWhatsAppGeoOptions = {
  governorates: [
    { id: '1', name: 'عمّان' },
    { id: '2', name: 'إربد' },
    { id: '3', name: 'الجيزة' },
  ],
  districts: [
    { id: '101', name: 'تلاع العلي', governorateId: '1' },
    { id: '201', name: 'الحي الشمالي', governorateId: '2' },
    { id: '301', name: 'المهندسين', governorateId: '3' },
  ],
};

let previewGroups: AdminWhatsAppGroupLinkItem[] = [
  {
    id: '00000000-0000-4000-9000-000000000001',
    groupCode: 'WA-AMMAN-01',
    groupName: 'مجموعة كباتن تلاع العلي والشميساني',
    leaderCaptainId: INITIAL_CAPTAINS[0].id,
    leaderFullName: INITIAL_CAPTAINS[0].fullName,
    leaderPhone: INITIAL_CAPTAINS[0].phone,
    leaderRole: INITIAL_CAPTAINS[0].role,
    leaderStatus: INITIAL_CAPTAINS[0].status,
    leaderRestricted: false,
    governorateId: 1,
    districtId: 101,
    governorateName: 'عمّان',
    districtName: 'تلاع العلي',
    status: 'ACTIVE',
    ownerUnlinkedAt: null,
    totalQualifiedSeconds: 18420,
    currentMonthQualifiedSeconds: 5640,
    qualifiedTripsCount: 34,
    currentMonthQualifiedTrips: 11,
    captainsCount: 18,
    ridersCount: 42,
    activeCaptainsCount: 12,
    activeRidersCount: 29,
    activeMembersCount: 60,
    createdAt: '2026-11-20T09:00:00Z',
    updatedAt: '2026-11-26T15:30:00Z',
  },
  {
    id: '00000000-0000-4000-9000-000000000002',
    groupCode: 'WA-IRBID-WEST',
    groupName: 'رابط مجموعة إربد السريع',
    leaderCaptainId: INITIAL_CAPTAINS[0].id,
    leaderFullName: INITIAL_CAPTAINS[0].fullName,
    leaderPhone: INITIAL_CAPTAINS[0].phone,
    leaderRole: INITIAL_CAPTAINS[0].role,
    leaderStatus: INITIAL_CAPTAINS[0].status,
    leaderRestricted: false,
    governorateId: 2,
    districtId: 201,
    governorateName: 'إربد',
    districtName: 'الحي الشمالي',
    status: 'ACTIVE',
    ownerUnlinkedAt: null,
    totalQualifiedSeconds: 4320,
    currentMonthQualifiedSeconds: 2100,
    qualifiedTripsCount: 9,
    currentMonthQualifiedTrips: 4,
    captainsCount: 7,
    ridersCount: 15,
    activeCaptainsCount: 4,
    activeRidersCount: 9,
    activeMembersCount: 22,
    createdAt: '2026-11-24T11:00:00Z',
    updatedAt: '2026-11-26T18:00:00Z',
  },
  {
    id: '00000000-0000-4000-9000-000000000003',
    groupCode: 'WA-GIZA-OLD',
    groupName: 'مجموعة المهندسين السابقة (مفكوكة الارتباط)',
    leaderCaptainId: INITIAL_CAPTAINS[2].id,
    leaderFullName: INITIAL_CAPTAINS[2].fullName,
    leaderPhone: INITIAL_CAPTAINS[2].phone,
    leaderRole: INITIAL_CAPTAINS[2].role,
    leaderStatus: INITIAL_CAPTAINS[2].status,
    leaderRestricted: false,
    governorateId: 3,
    districtId: 301,
    governorateName: 'الجيزة',
    districtName: 'المهندسين',
    status: 'INACTIVE',
    ownerUnlinkedAt: '2026-11-25T14:20:00Z',
    totalQualifiedSeconds: 9120,
    currentMonthQualifiedSeconds: 0,
    qualifiedTripsCount: 16,
    currentMonthQualifiedTrips: 0,
    captainsCount: 0,
    ridersCount: 0,
    activeCaptainsCount: 0,
    activeRidersCount: 0,
    activeMembersCount: 0,
    createdAt: '2026-11-10T08:00:00Z',
    updatedAt: '2026-11-25T14:20:00Z',
  },
];

export function getPreviewWhatsAppGroupsResponse(): AdminWhatsAppGroupsResponse {
  return {
    success: true,
    schemaReady: true,
    monthlySchemaReady: true,
    periodMonth: '2026-11',
    groups: [...previewGroups],
    captains: [...INITIAL_CAPTAINS],
    summary: computeWhatsAppGroupsSummary(previewGroups),
    geoOptions: INITIAL_GEO,
  };
}

export function createPreviewWhatsAppGroup(input: {
  groupName: string;
  groupCode?: string;
  leaderCaptainId: string;
}): string {
  const cap = INITIAL_CAPTAINS.find((c) => c.id === input.leaderCaptainId) || INITIAL_CAPTAINS[0];
  const code = (input.groupCode || `WA-${Math.random().toString(36).slice(2, 8)}`).toUpperCase();
  const newItem: AdminWhatsAppGroupLinkItem = {
    id: `00000000-0000-4000-9000-${Date.now().toString().slice(-12).padStart(12, '0')}`,
    groupCode: code,
    groupName: input.groupName,
    leaderCaptainId: cap.id,
    leaderFullName: cap.fullName,
    leaderPhone: cap.phone,
    leaderRole: cap.role,
    leaderStatus: cap.status,
    leaderRestricted: false,
    governorateId: cap.governorateId ?? null,
    districtId: cap.districtId ?? null,
    governorateName: cap.governorateName || '',
    districtName: cap.districtName || '',
    status: 'ACTIVE',
    ownerUnlinkedAt: null,
    totalQualifiedSeconds: 0,
    currentMonthQualifiedSeconds: 0,
    qualifiedTripsCount: 0,
    currentMonthQualifiedTrips: 0,
    captainsCount: 1,
    ridersCount: 0,
    activeCaptainsCount: 1,
    activeRidersCount: 0,
    activeMembersCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  previewGroups = [newItem, ...previewGroups];
  return code;
}

export function togglePreviewWhatsAppGroup(id: string, status: 'ACTIVE' | 'INACTIVE'): void {
  previewGroups = previewGroups.map((g) =>
    g.id === id && !g.ownerUnlinkedAt ? { ...g, status, updatedAt: new Date().toISOString() } : g
  );
}

export function unlinkPreviewWhatsAppGroup(id: string): number {
  let released = 0;
  previewGroups = previewGroups.map((g) => {
    if (g.id !== id) return g;
    released = g.activeMembersCount;
    return {
      ...g,
      status: 'INACTIVE',
      ownerUnlinkedAt: new Date().toISOString(),
      captainsCount: 0,
      ridersCount: 0,
      activeCaptainsCount: 0,
      activeRidersCount: 0,
      activeMembersCount: 0,
      updatedAt: new Date().toISOString(),
    };
  });
  return released;
}
