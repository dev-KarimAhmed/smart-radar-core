'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { RiderUser } from '@/features/admin/types/rider-management';
import {
  fetchRidersData,
  executeRiderAdminAction,
} from '@/features/admin/services/riders-admin-service';
import { useRidersFilters } from './use-riders-filters';
import { useRidersMessaging } from './use-riders-messaging';

export function useRidersManagement() {
  const t = useTranslations('adminRiders');
  const { direction, isArabic } = useDashboardLanguage();
  const { toast } = useToast();

  const [riders, setRiders] = useState<RiderUser[]>([]);
  const [totalRidersCount, setTotalRidersCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const filters = useRidersFilters({ riders });
  const {
    setGeoLookup,
    clearSelection,
    appliedFilters,
    applyFilters,
  } = filters;
  const requestSeqRef = useRef(0);

  // Modals state
  const [inspectRider, setInspectRider] = useState<RiderUser | null>(null);
  const [securityRider, setSecurityRider] = useState<RiderUser | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('IDLE');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Inactivity simulation state
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simulationRiderId, setSimulationRiderId] = useState<string | null>(null);

  const handleOpenSimulationForRider = (rider: RiderUser) => {
    setSimulationRiderId(rider.id);
    setIsSimulationOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const messaging = useRidersMessaging(isArabic);

  const fetchRiders = useCallback(async (quiet = false) => {
    const seq = ++requestSeqRef.current;
    if (!appliedFilters) {
      setRiders([]);
      clearSelection();
      try {
        const meta = await fetchRidersData({ metaOnly: true });
        if (seq !== requestSeqRef.current) return;
        if (meta.geo) setGeoLookup(meta.geo);
        if (typeof meta.totalCount === 'number') setTotalRidersCount(meta.totalCount);
      } catch (err) {
        console.warn('[RidersManagementPanel] meta fetch error:', err);
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
      return;
    }

    if (!quiet) setLoading(true);
    try {
      const data = await fetchRidersData({
        countryId: appliedFilters.selectedCountry,
        governorateId: appliedFilters.selectedGovernorate,
        districtId: appliedFilters.selectedDistrict,
        status: appliedFilters.statusFilter,
        q: appliedFilters.searchQuery,
      });
      if (seq !== requestSeqRef.current) return;
      setRiders(data.users);
      if (data.geo) setGeoLookup(data.geo);
    } catch (err: any) {
      if (seq !== requestSeqRef.current) return;
      console.warn('[RidersManagementPanel] fetch error:', err);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ استدعاء المستخدمين' : 'Riders Fetch Error',
        description: err.message || (isArabic ? 'تعذر جلب بيانات المستخدمين من قاعدة البيانات' : 'Could not fetch riders from database'),
      });
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  }, [
    appliedFilters,
    toast,
    isArabic,
    setGeoLookup,
    clearSelection,
  ]);

  useEffect(() => {
    void fetchRiders(false);
  }, [fetchRiders]);

  const executeAdminAction = async (payload: Record<string, any>, successMsg: string) => {
    setSubmittingAction(true);
    try {
      const result = await executeRiderAdminAction(payload);
      toast({
        title: isArabic ? '⚡ تم تنفيذ الإجراء بنجاح' : '⚡ Action Executed Successfully',
        description: isArabic ? (result.message || successMsg) : successMsg,
      });
      await fetchRiders(true);
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل العملية' : 'Operation Failed',
        description: err.message || (isArabic ? 'تعذر تطبيق الإجراء' : 'Could not apply action'),
      });
      return false;
    } finally {
      setSubmittingAction(false);
    }
  };

  return {
    t,
    isArabic,
    direction,
    riders,
    totalRidersCount,
    loading,
    fetchRiders,
    handleApplyFilters: applyFilters,
    executeAdminAction,
    ...filters,
    inspectRider,
    setInspectRider,
    securityRider,
    setSecurityRider,
    targetStatus,
    setTargetStatus,
    submittingAction,
    isSimulationOpen,
    setIsSimulationOpen,
    simulationRiderId,
    setSimulationRiderId,
    handleOpenSimulationForRider,
    ...messaging,
  };
}
