'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';
import {
  ALL_SECTOR_IDS,
  ALL_SUB_PERMISSION_IDS,
  AdminGeoScope,
  AdminSectorId,
  UNRESTRICTED_GEO_SCOPE,
  getAllSubPermissionIdsForSectors,
} from '../lib/admin-permissions';
import {
  AdminProfile,
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
} from '../types/admin-profile';
import {
  fetchAdminsList,
  updateAdminPermissions,
  updateAdminRank,
  deleteAdmin,
} from '../services/admins-management-service';
import { useAdminCreateForm } from './use-admin-create-form';

const EMPTY_GEO_LOOKUP: GeoLookup = { countries: [], governorates: [], districts: [] };

export function useAdminsManagement() {
  const t = useTranslations('adminAdmins');
  const { user } = useAuth();
  const { isArabic, direction } = useDashboardLanguage();

  const isCallerPrimary =
    user?.uid === PRIMARY_SOVEREIGN_ADMIN_ID ||
    user?.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE;

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [geoLookup, setGeoLookup] = useState<GeoLookup>(EMPTY_GEO_LOOKUP);
  const [callerRank, setCallerRank] = useState<'GENERAL_ADMIN' | 'ASSISTANT_ADMIN' | null>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      return 'GENERAL_ADMIN';
    }
    return user?.adminRank || null;
  });
  const [callerId, setCallerId] = useState<string | null>(user?.uid || null);
  const [loading, setLoading] = useState(true);

  // Edit Permissions Modal State
  const [editPermissionsTarget, setEditPermissionsTarget] = useState<AdminProfile | null>(null);
  const [editRank, setEditRank] = useState<'GENERAL_ADMIN' | 'ASSISTANT_ADMIN'>('ASSISTANT_ADMIN');
  const [editSectors, setEditSectors] = useState<AdminSectorId[]>([...ALL_SECTOR_IDS]);
  const [editPermissions, setEditPermissions] = useState<string[]>([...ALL_SUB_PERMISSION_IDS]);
  const [editGeoScope, setEditGeoScope] = useState<AdminGeoScope>({ ...UNRESTRICTED_GEO_SCOPE });
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Actions & Dialog state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isGeneralAdmin =
    callerRank === 'GENERAL_ADMIN' ||
    isCallerPrimary ||
    user?.adminRank === 'GENERAL_ADMIN';

  useEffect(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      setCallerRank('GENERAL_ADMIN');
    }
    if (user?.uid && !callerId) {
      setCallerId(user.uid);
    }
  }, [isCallerPrimary, user?.adminRank, user?.uid, callerId]);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdminsList();
      if (data?.success && Array.isArray(data.admins)) {
        setAdmins(data.admins);
        if (data.geo) setGeoLookup(data.geo);
        if (isCallerPrimary) {
          setCallerRank('GENERAL_ADMIN');
        } else if (data.callerRank) {
          setCallerRank(data.callerRank);
        }
        if (data.callerId) {
          setCallerId(data.callerId);
        } else if (user?.uid) {
          setCallerId(user.uid);
        }
      }
    } catch (err) {
      console.error('[AdminsManagementPanel] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isCallerPrimary, user?.uid]);

  useEffect(() => {
    void fetchAdmins();
  }, [fetchAdmins]);

  const createForm = useAdminCreateForm({
    t,
    isGeneralAdmin,
    onSuccess: fetchAdmins,
  });

  const handleSavePermissions = async () => {
    if (!editPermissionsTarget || !isGeneralAdmin || editPermissionsTarget.is_primary) return;
    try {
      setSavingPermissions(true);
      setActionFeedback(null);
      const finalSectors = editRank === 'GENERAL_ADMIN' ? [...ALL_SECTOR_IDS] : editSectors;
      const finalPerms = editRank === 'GENERAL_ADMIN' ? [...ALL_SUB_PERMISSION_IDS] : editPermissions;
      const finalGeo = editRank === 'GENERAL_ADMIN' ? { ...UNRESTRICTED_GEO_SCOPE } : editGeoScope;

      const result = await updateAdminPermissions({
        adminId: editPermissionsTarget.id,
        adminRank: editRank,
        allowedSectors: finalSectors,
        allowedPermissions: finalPerms,
        geoScope: finalGeo,
      });

      if (!result?.success) {
        throw new Error(result?.error || t('errGeneric'));
      }

      setActionFeedback({
        type: 'success',
        message: isArabic
          ? 'تم تحديث صلاحيات المشرف والنطاق الجغرافي بنجاح.'
          : 'Admin permissions and geo scope updated successfully.',
      });
      setEditPermissionsTarget(null);
      await fetchAdmins();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || t('errGeneric') });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleUpdateRank = async (targetAdmin: AdminProfile, newRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN') => {
    if (!isGeneralAdmin || targetAdmin.is_primary) return;
    try {
      setActionLoading(targetAdmin.id);
      setActionFeedback(null);
      const result = await updateAdminRank(targetAdmin.id, newRank);

      if (!result?.success) {
        throw new Error(result?.error || t('errGeneric'));
      }

      setActionFeedback({ type: 'success', message: t('rankUpdatedSuccess') });
      await fetchAdmins();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || t('errGeneric') });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteTarget || !isGeneralAdmin || deleteTarget.is_primary || deleteTarget.id === callerId) return;
    try {
      setDeleting(true);
      setActionFeedback(null);
      const result = await deleteAdmin(deleteTarget.id);

      if (!result?.success) {
        throw new Error(result?.error || t('errGeneric'));
      }

      setActionFeedback({ type: 'success', message: t('adminDeletedSuccess') });
      setDeleteTarget(null);
      await fetchAdmins();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || t('errGeneric') });
    } finally {
      setDeleting(false);
    }
  };

  const openEditPermissions = (target: AdminProfile) => {
    const sectors = target.allowed_sectors || [];
    const perms = Array.isArray(target.allowed_permissions)
      ? target.allowed_permissions
      : getAllSubPermissionIdsForSectors(sectors);
    setEditPermissionsTarget(target);
    setEditRank(target.admin_rank || 'ASSISTANT_ADMIN');
    setEditSectors(sectors);
    setEditPermissions(perms);
    setEditGeoScope(target.geo_scope || { ...UNRESTRICTED_GEO_SCOPE });
  };

  const generalAdminsCount = admins.filter(
    (a) =>
      a.admin_rank === 'GENERAL_ADMIN' ||
      a.is_primary ||
      a.id === PRIMARY_SOVEREIGN_ADMIN_ID ||
      a.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE
  ).length;
  const assistantAdminsCount = Math.max(0, admins.length - generalAdminsCount);

  return {
    t,
    isArabic,
    direction,
    callerId,
    admins,
    geoLookup,
    loading,
    editPermissionsTarget,
    setEditPermissionsTarget,
    editRank,
    setEditRank,
    editSectors,
    setEditSectors,
    editPermissions,
    setEditPermissions,
    editGeoScope,
    setEditGeoScope,
    savingPermissions,
    actionLoading,
    actionFeedback,
    deleteTarget,
    setDeleteTarget,
    deleting,
    isGeneralAdmin,
    generalAdminsCount,
    assistantAdminsCount,
    handleSavePermissions,
    handleUpdateRank,
    handleDeleteAdmin,
    openEditPermissions,
    ...createForm,
  };
}
