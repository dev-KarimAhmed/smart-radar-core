'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import { ALL_SECTOR_IDS, AdminSectorId } from '@/features/admin/lib/admin-permissions';
import {
  type AdminProfile,
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
} from './admins-types';

export function useAdminsManagement() {
  const t = useTranslations('adminAdmins');
  const tAuto = useTranslations('auto');
  const { isArabic, direction } = useDashboardLanguage();
  const { user } = useAuth();

  const isCallerPrimary =
    user?.uid === PRIMARY_SOVEREIGN_ADMIN_ID ||
    user?.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE;

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [callerRank, setCallerRank] = useState<'GENERAL_ADMIN' | 'ASSISTANT_ADMIN' | null>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      return 'GENERAL_ADMIN';
    }
    return user?.adminRank || null;
  });
  const [callerId, setCallerId] = useState<string | null>(user?.uid || null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+9627');
  const [password, setPassword] = useState('');
  const [adminRank, setAdminRank] = useState<'GENERAL_ADMIN' | 'ASSISTANT_ADMIN'>('ASSISTANT_ADMIN');
  const [allowedSectors, setAllowedSectors] = useState<AdminSectorId[]>([...ALL_SECTOR_IDS]);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit Permissions Modal State
  const [editPermissionsTarget, setEditPermissionsTarget] = useState<AdminProfile | null>(null);
  const [editRank, setEditRank] = useState<'GENERAL_ADMIN' | 'ASSISTANT_ADMIN'>('ASSISTANT_ADMIN');
  const [editSectors, setEditSectors] = useState<AdminSectorId[]>([...ALL_SECTOR_IDS]);
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
      const res = await adminFetch('/api/admin/list-admins');
      const data = await res.json();
      if (data?.success && Array.isArray(data.admins)) {
        setAdmins(data.admins);
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

  // Handle Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGeneralAdmin) return;
    setFormError(null);
    setFormSuccess(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setFormError(t('errName'));
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setFormError(t('errPhone'));
      return;
    }
    if (!password || password.length < 8) {
      setFormError(t('errPassword'));
      return;
    }

    try {
      setSubmitting(true);
      const res = await adminFetch('/api/admin/create-sub-admin', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          password,
          adminRank,
          allowedSectors: adminRank === 'GENERAL_ADMIN' ? [...ALL_SECTOR_IDS] : allowedSectors,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result?.error || t('errGeneric'));
      }

      setFormSuccess(t('successCreated'));
      setFullName('');
      setPhone('+9627');
      setPassword('');
      setAdminRank('ASSISTANT_ADMIN');
      setAllowedSectors([...ALL_SECTOR_IDS]);
      await fetchAdmins();
      setTimeout(() => {
        setIsAdding(false);
        setFormSuccess(null);
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || t('errGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Save Admin Permissions & Rank
  const handleSavePermissions = async () => {
    if (!editPermissionsTarget || !isGeneralAdmin || editPermissionsTarget.is_primary) return;
    try {
      setSavingPermissions(true);
      setActionFeedback(null);
      const finalSectors = editRank === 'GENERAL_ADMIN' ? [...ALL_SECTOR_IDS] : editSectors;
      const res = await adminFetch('/api/admin/update-admin-permissions', {
        method: 'POST',
        body: JSON.stringify({
          adminId: editPermissionsTarget.id,
          adminRank: editRank,
          allowedSectors: finalSectors,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result?.error || t('errGeneric'));
      }

      setActionFeedback({
        type: 'success',
        message: isArabic ? 'تم تحديث صلاحيات المشرف ورتبته بنجاح.' : 'Admin permissions updated successfully.',
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

  // Handle Update Admin Rank
  const handleUpdateRank = async (targetAdmin: AdminProfile, newRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN') => {
    if (!isGeneralAdmin || targetAdmin.is_primary) return;
    try {
      setActionLoading(targetAdmin.id);
      setActionFeedback(null);
      const res = await adminFetch('/api/admin/update-admin-rank', {
        method: 'POST',
        body: JSON.stringify({
          targetAdminId: targetAdmin.id,
          newRank,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
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

  // Handle Confirm Delete Admin
  const handleDeleteAdmin = async () => {
    if (!deleteTarget || !isGeneralAdmin || deleteTarget.is_primary || deleteTarget.id === callerId) return;
    try {
      setDeleting(true);
      setActionFeedback(null);
      const res = await adminFetch('/api/admin/delete-admin', {
        method: 'POST',
        body: JSON.stringify({
          targetAdminId: deleteTarget.id,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
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
    tAuto,
    isArabic,
    direction,
    user,
    admins,
    callerRank,
    callerId,
    loading,
    isAdding,
    setIsAdding,
    submitting,
    fullName,
    setFullName,
    phone,
    setPhone,
    password,
    setPassword,
    adminRank,
    setAdminRank,
    allowedSectors,
    setAllowedSectors,
    showPassword,
    setShowPassword,
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    editPermissionsTarget,
    setEditPermissionsTarget,
    editRank,
    setEditRank,
    editSectors,
    setEditSectors,
    savingPermissions,
    actionLoading,
    actionFeedback,
    deleteTarget,
    setDeleteTarget,
    deleting,
    isGeneralAdmin,
    generalAdminsCount,
    assistantAdminsCount,
    fetchAdmins,
    handleCreateAdmin,
    handleSavePermissions,
    handleUpdateRank,
    handleDeleteAdmin,
  };
}
