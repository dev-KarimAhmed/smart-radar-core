'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  EMPTY_ADMIN_GROUPS_SUMMARY, buildWhatsAppGroupShareUrl, filterAndSortWhatsAppGroupZones, formatOperationalDuration,
  type AdminCaptainLookupItem, type AdminWhatsAppGeoOption, type AdminWhatsAppGeoOptions,
  type AdminWhatsAppGroupLinkItem, type AdminWhatsAppGroupsSummary,
  type WhatsAppGroupActivityFilter, type WhatsAppGroupLinkStatus, type WhatsAppGroupZoneSortMode,
} from '@/features/whatsapp-groups/contract';
import { AdminWhatsAppGroupsApiError, defaultAdminWhatsAppGroupsGateway, type AdminWhatsAppGroupsGateway } from '@/features/admin/lib/whatsapp-groups-admin-api';

export interface UseAdminWhatsAppGroupsDeps {
  gateway?: Pick<AdminWhatsAppGroupsGateway, 'fetchGroups' | 'toggleStatus'> & Partial<Pick<AdminWhatsAppGroupsGateway, 'unlinkOwner'>>;
  copyText?: (text: string) => Promise<void>;
}
const defaultCopyText = (text: string): Promise<void> =>
  typeof navigator !== 'undefined' && navigator.clipboard?.writeText ? navigator.clipboard.writeText(text) : Promise.reject(new Error('CLIPBOARD_UNAVAILABLE'));
export interface AdminWhatsAppGroupCardItem { item: AdminWhatsAppGroupLinkItem; formattedDuration: string; formattedMonthDuration: string; sharePath: string; }

export interface UseAdminWhatsAppGroupsResult {
  captains: AdminCaptainLookupItem[]; leaderGroupCounts: Readonly<Record<string, number>>; summary: AdminWhatsAppGroupsSummary;
  totalGroupsOverall: number; activeGroupsOverall: number; totalMembersOverall: number;
  displayActiveCaptains: number; displayActiveRiders: number; hasActiveFilters: boolean; canResetFilters: boolean;
  schemaReady: boolean; monthlySchemaReady: boolean; filteredCards: AdminWhatsAppGroupCardItem[];
  governorateOptions: AdminWhatsAppGeoOption[]; districtOptions: AdminWhatsAppGeoOption[];
  totalQualifiedFormatted: string; totalMonthQualifiedFormatted: string; overallQualifiedFormatted: string;
  loading: boolean; searchTerm: string; statusFilter: 'ALL' | WhatsAppGroupLinkStatus;
  governorateFilter: string; districtFilter: string; activityFilter: WhatsAppGroupActivityFilter; sortMode: WhatsAppGroupZoneSortMode;
  copiedId: string | null; togglingId: string | null; pendingDeactivateId: string | null; unlinkingId: string | null; pendingUnlinkId: string | null; modalOpen: boolean;
  setSearchTerm: (value: string) => void; setGovernorateFilter: (value: string) => void; setDistrictFilter: (value: string) => void;
  setActivityFilter: (value: WhatsAppGroupActivityFilter) => void; setSortMode: (value: WhatsAppGroupZoneSortMode) => void;
  setModalOpen: (open: boolean) => void; openModal: () => void; filterAll: () => void; filterActive: () => void; filterInactive: () => void;
  resetZoneFilters: () => void; cancelDeactivate: () => void; cancelUnlink: () => void; loadData: () => Promise<void>; handleGroupCreated: () => Promise<void>;
  handleCopy: (value: string, key: string, mode: 'link' | 'code') => Promise<void>;
  handleToggleStatus: (item: AdminWhatsAppGroupLinkItem) => Promise<void>; handleUnlinkOwner: (item: AdminWhatsAppGroupLinkItem) => Promise<void>;
}

function resolveErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function useAdminWhatsAppGroups(deps?: UseAdminWhatsAppGroupsDeps): UseAdminWhatsAppGroupsResult {
  const gateway = deps?.gateway ?? defaultAdminWhatsAppGroupsGateway;
  const copyText = deps?.copyText ?? defaultCopyText;
  const t = useTranslations('adminWhatsappGroups');
  const { toast } = useToast();

  const [groups, setGroups] = useState<AdminWhatsAppGroupLinkItem[]>([]);
  const [captains, setCaptains] = useState<AdminCaptainLookupItem[]>([]);
  const [geoOptions, setGeoOptions] = useState<AdminWhatsAppGeoOptions | null>(null);
  const [serverSummary, setServerSummary] = useState<AdminWhatsAppGroupsSummary | null>(null);
  const [schemaReady, setSchemaReady] = useState(true);
  const [monthlySchemaReady, setMonthlySchemaReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WhatsAppGroupLinkStatus>('ALL');
  const [governorateFilter, setGovernorateFilterState] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [activityFilter, setActivityFilter] = useState<WhatsAppGroupActivityFilter>('ALL');
  const [sortMode, setSortMode] = useState<WhatsAppGroupZoneSortMode>('least_captain_ops');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [pendingUnlinkId, setPendingUnlinkId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isMountedRef = useRef(true);
  const loadRequestIdRef = useRef(0);
  const togglingRef = useRef(false);
  const unlinkingRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false; loadRequestIdRef.current += 1;
      togglingRef.current = false; unlinkingRef.current = false;
      if (copyTimerRef.current) { clearTimeout(copyTimerRef.current); copyTimerRef.current = null; }
    };
  }, []);

  const unitLabels = useMemo(() => ({ hoursUnit: t('hoursUnit'), minutesUnit: t('minutesUnit'), secondsUnit: t('secondsUnit') }), [t]);

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    const reqId = ++loadRequestIdRef.current;
    setLoading(true);
    try {
      const data = await gateway.fetchGroups(t('errorTitle'));
      if (!isMountedRef.current || reqId !== loadRequestIdRef.current) return;
      setGroups(data.groups || []); setCaptains(data.captains || []);
      setGeoOptions(data.geoOptions ?? null); setServerSummary(data.summary ?? null);
      setSchemaReady(data.schemaReady !== false); setMonthlySchemaReady(data.monthlySchemaReady !== false);
    } catch (err: unknown) {
      if (!isMountedRef.current || reqId !== loadRequestIdRef.current) return;
      toast({ variant: 'destructive', title: t('errorTitle'), description: resolveErrorMessage(err, t('errorTitle')) });
    } finally {
      if (isMountedRef.current && reqId === loadRequestIdRef.current) setLoading(false);
    }
  }, [gateway, t, toast]);

  useEffect(() => { void loadData(); }, [loadData]);

  const zoneView = useMemo(
    () => filterAndSortWhatsAppGroupZones(groups, { searchTerm, statusFilter, governorateFilter, districtFilter, activityFilter, sortMode }, t('zoneUnassigned')),
    [activityFilter, districtFilter, governorateFilter, groups, searchTerm, sortMode, statusFilter, t],
  );

  const filteredCards = useMemo<AdminWhatsAppGroupCardItem[]>(
    () =>
      zoneView.items.map((item) => ({
        item,
        formattedDuration: formatOperationalDuration(item.totalQualifiedSeconds, unitLabels),
        formattedMonthDuration: formatOperationalDuration(item.currentMonthQualifiedSeconds, unitLabels),
        sharePath: buildWhatsAppGroupShareUrl(item.groupCode, ''),
      })),
    [unitLabels, zoneView.items],
  );

  const summary = groups.length > 0 ? zoneView.summary : EMPTY_ADMIN_GROUPS_SUMMARY;
  const totalGroupsOverall = groups.length;
  const activeGroupsOverall = useMemo(() => serverSummary?.activeGroups ?? groups.reduce((acc, g) => acc + (g.status === 'ACTIVE' ? 1 : 0), 0), [groups, serverSummary]);
  const leaderGroupCounts = useMemo<Readonly<Record<string, number>>>(() => {
    const counts: Record<string, number> = {};
    for (const g of groups) if (!g.ownerUnlinkedAt) counts[g.leaderCaptainId] = (counts[g.leaderCaptainId] || 0) + 1;
    return counts;
  }, [groups]);
  const totalQualifiedSecondsOverall = useMemo(() => serverSummary?.totalQualifiedSeconds ?? groups.reduce((acc, g) => acc + Math.max(0, g.totalQualifiedSeconds), 0), [groups, serverSummary]);
  const totalMembersOverall = useMemo(() => serverSummary?.totalActiveMembers ?? groups.reduce((acc, g) => acc + Math.max(0, g.activeMembersCount), 0), [groups, serverSummary]);
  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter !== 'ALL' || governorateFilter !== 'ALL' || districtFilter !== 'ALL' || activityFilter !== 'ALL');
  const canResetFilters = hasActiveFilters || sortMode !== 'least_captain_ops';
  const displayActiveCaptains = hasActiveFilters ? summary.totalActiveCaptains : (serverSummary?.totalActiveCaptains ?? summary.totalActiveCaptains);
  const displayActiveRiders = hasActiveFilters ? summary.totalActiveRiders : (serverSummary?.totalActiveRiders ?? summary.totalActiveRiders);
  const hasUnassignedZone = useMemo(() => groups.some((g) => g.governorateId == null && !g.governorateName.trim()), [groups]);
  const governorateOptions = useMemo(() => {
    const base = geoOptions && geoOptions.governorates.length > 0 ? geoOptions.governorates : zoneView.governorateOptions;
    if (!hasUnassignedZone || base.some((o) => o.id === 'UNASSIGNED')) return base;
    return [...base, { id: 'UNASSIGNED', name: t('zoneUnassigned') }];
  }, [geoOptions, hasUnassignedZone, t, zoneView.governorateOptions]);
  const districtOptions = useMemo(() => {
    if (governorateFilter === 'UNASSIGNED') return [];
    if (!geoOptions || geoOptions.districts.length === 0) return zoneView.districtOptions;
    return governorateFilter === 'ALL' ? geoOptions.districts : geoOptions.districts.filter((d) => d.governorateId === governorateFilter);
  }, [geoOptions, governorateFilter, zoneView.districtOptions]);
  const totalQualifiedFormatted = useMemo(() => formatOperationalDuration(summary.totalQualifiedSeconds, unitLabels), [summary.totalQualifiedSeconds, unitLabels]);
  const totalMonthQualifiedFormatted = useMemo(() => formatOperationalDuration(summary.currentMonthQualifiedSeconds ?? 0, unitLabels), [summary.currentMonthQualifiedSeconds, unitLabels]);
  const overallQualifiedFormatted = useMemo(() => formatOperationalDuration(totalQualifiedSecondsOverall, unitLabels), [totalQualifiedSecondsOverall, unitLabels]);

  const handleCopy = useCallback(async (value: string, key: string, mode: 'link' | 'code') => {
    try {
      await copyText(mode === 'link' ? buildWhatsAppGroupShareUrl(value) : value);
      if (!isMountedRef.current) return;
      setCopiedId(key);
      toast({ title: mode === 'link' ? t('copiedLinkTitle') : t('copiedCodeTitle') });
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => { if (isMountedRef.current) setCopiedId((cur) => (cur === key ? null : cur)); }, 1500);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const msg = err instanceof Error && err.message === 'CLIPBOARD_UNAVAILABLE' ? t('copyUnsupportedError') : t('errorTitle');
      toast({ variant: 'destructive', title: t('errorTitle'), description: msg });
    }
  }, [copyText, t, toast]);

  const handleToggleStatus = useCallback(
    async (item: AdminWhatsAppGroupLinkItem) => {
      if (togglingRef.current) return;
      if (unlinkingRef.current || item.ownerUnlinkedAt) return;
      if (item.status === 'ACTIVE' && pendingDeactivateId !== item.id) {
        setPendingUnlinkId(null); setPendingDeactivateId(item.id); return;
      }
      togglingRef.current = true; setPendingDeactivateId(null);
      const nextStatus: WhatsAppGroupLinkStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      setTogglingId(item.id);
      try {
        await gateway.toggleStatus({ id: item.id, status: nextStatus }, t('errorTitle'));
        if (!isMountedRef.current) return;
        toast({ title: t('statusUpdatedTitle') });
        await loadData();
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        const code = err instanceof AdminWhatsAppGroupsApiError ? err.errorCode : undefined;
        const desc = code === 'OWNER_UNLINKED' ? t('errOwnerUnlinked') : code === 'CAPTAIN_INELIGIBLE' ? t('errCaptainIneligible') : code === 'GROUP_NOT_FOUND' ? t('errGroupNotFound') : code === 'SCHEMA_NOT_READY' ? t('schemaNotReadyTitle') : resolveErrorMessage(err, t('errorTitle'));
        toast({ variant: 'destructive', title: t('errorTitle'), description: desc });
      } finally {
        togglingRef.current = false;
        if (isMountedRef.current) setTogglingId(null);
      }
    },
    [gateway, loadData, pendingDeactivateId, t, toast],
  );

  const handleUnlinkOwner = useCallback(
    async (item: AdminWhatsAppGroupLinkItem) => {
      if (unlinkingRef.current || togglingRef.current || item.ownerUnlinkedAt) return;
      if (pendingUnlinkId !== item.id) {
        setPendingDeactivateId(null); setPendingUnlinkId(item.id); return;
      }
      const unlinkFn = gateway.unlinkOwner ?? defaultAdminWhatsAppGroupsGateway.unlinkOwner;
      unlinkingRef.current = true; setPendingUnlinkId(null); setUnlinkingId(item.id);
      try {
        const res = await unlinkFn({ id: item.id, action: 'UNLINK_OWNER' }, t('errorTitle'));
        if (!isMountedRef.current) return;
        toast({ title: t('ownerUnlinkedTitle'), description: t('ownerUnlinkedDesc', { count: res.releasedMembersCount ?? 0 }) });
        await loadData();
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        const code = err instanceof AdminWhatsAppGroupsApiError ? err.errorCode : undefined;
        const desc = code === 'ALREADY_UNLINKED' || code === 'OWNER_UNLINKED' ? t('errOwnerUnlinked') : code === 'GROUP_NOT_FOUND' ? t('errGroupNotFound') : code === 'SCHEMA_NOT_READY' ? t('schemaNotReadyTitle') : resolveErrorMessage(err, t('errorTitle'));
        toast({ variant: 'destructive', title: t('errorTitle'), description: desc });
      } finally {
        unlinkingRef.current = false;
        if (isMountedRef.current) setUnlinkingId(null);
      }
    },
    [gateway, loadData, pendingUnlinkId, t, toast],
  );

  const setGovernorateFilter = useCallback((value: string) => { setGovernorateFilterState(value); setDistrictFilter('ALL'); setPendingDeactivateId(null); setPendingUnlinkId(null); }, []);
  const openModal = useCallback(() => setModalOpen(true), []);
  const filterAll = useCallback(() => { setStatusFilter('ALL'); setPendingDeactivateId(null); setPendingUnlinkId(null); }, []);
  const filterActive = useCallback(() => { setStatusFilter('ACTIVE'); setPendingDeactivateId(null); setPendingUnlinkId(null); }, []);
  const filterInactive = useCallback(() => { setStatusFilter('INACTIVE'); setPendingDeactivateId(null); setPendingUnlinkId(null); }, []);
  const cancelDeactivate = useCallback(() => setPendingDeactivateId(null), []);
  const cancelUnlink = useCallback(() => setPendingUnlinkId(null), []);
  const resetZoneFilters = useCallback(() => {
    setSearchTerm(''); setStatusFilter('ALL'); setGovernorateFilterState('ALL');
    setDistrictFilter('ALL'); setActivityFilter('ALL'); setSortMode('least_captain_ops');
    setPendingDeactivateId(null); setPendingUnlinkId(null);
  }, []);
  const handleGroupCreated = useCallback(async () => {
    if (hasActiveFilters) resetZoneFilters();
    setSortMode('newest');
    await loadData();
  }, [hasActiveFilters, loadData, resetZoneFilters]);

  return {
    captains, leaderGroupCounts, summary, totalGroupsOverall, activeGroupsOverall, totalMembersOverall, displayActiveCaptains, displayActiveRiders, hasActiveFilters, canResetFilters, schemaReady, monthlySchemaReady,
    filteredCards, governorateOptions, districtOptions, totalQualifiedFormatted, totalMonthQualifiedFormatted, overallQualifiedFormatted, loading,
    searchTerm, statusFilter, governorateFilter, districtFilter, activityFilter, sortMode,
    copiedId, togglingId, pendingDeactivateId, unlinkingId, pendingUnlinkId, modalOpen,
    setSearchTerm, setGovernorateFilter, setDistrictFilter, setActivityFilter, setSortMode, setModalOpen,
    openModal, filterAll, filterActive, filterInactive, resetZoneFilters, cancelDeactivate, cancelUnlink,
    loadData, handleGroupCreated, handleCopy, handleToggleStatus, handleUnlinkOwner,
  };
}
