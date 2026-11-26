'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { normalizePhoneForCountry } from '@/features/auth/utils/registration-helpers';
import {
  ALL_SECTOR_IDS,
  ALL_SUB_PERMISSION_IDS,
  AdminGeoScope,
  AdminSectorId,
  UNRESTRICTED_GEO_SCOPE,
} from '../lib/admin-permissions';
import { createSubAdmin } from '../services/admins-management-service';

export function useAdminCreateForm({
  t,
  isGeneralAdmin,
  onSuccess,
}: {
  t: any;
  isGeneralAdmin: boolean;
  onSuccess: () => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+9627');
  const [password, setPassword] = useState('');
  const [adminRank, setAdminRank] = useState<'GENERAL_ADMIN' | 'ASSISTANT_ADMIN'>('ASSISTANT_ADMIN');
  const [allowedSectors, setAllowedSectors] = useState<AdminSectorId[]>([...ALL_SECTOR_IDS]);
  const [allowedPermissions, setAllowedPermissions] = useState<string[]>([...ALL_SUB_PERMISSION_IDS]);
  const [geoScope, setGeoScopeState] = useState<AdminGeoScope>({ ...UNRESTRICTED_GEO_SCOPE });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const setGeoScope = useCallback(
    (updater: React.SetStateAction<AdminGeoScope>) => {
      setGeoScopeState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        // Sync default untouched phone prefix when picking a specific country
        if (next.countryId === 2 && phone === '+9627') {
          setPhone('+201');
        } else if (next.countryId === 1 && phone === '+201') {
          setPhone('+9627');
        }
        return next;
      });
    },
    [phone]
  );

  const phoneValidation = useMemo(() => {
    const val = phone.trim();
    if (!val) return { ok: false, message: t('phoneLabel') };
    return normalizePhoneForCountry(val, null);
  }, [phone, t]);
  const isPhoneValid = phoneValidation.ok;

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
    if (adminRank === 'ASSISTANT_ADMIN' && (allowedSectors.length === 0 || allowedPermissions.length === 0)) {
      setFormError('يرجى اختيار قطاع واحد وصلاحية فرعية واحدة على الأقل للمشرف المساعد.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await createSubAdmin({
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
        adminRank,
        allowedSectors: adminRank === 'GENERAL_ADMIN' ? [...ALL_SECTOR_IDS] : allowedSectors,
        allowedPermissions: adminRank === 'GENERAL_ADMIN' ? [...ALL_SUB_PERMISSION_IDS] : allowedPermissions,
        geoScope: adminRank === 'GENERAL_ADMIN' ? { ...UNRESTRICTED_GEO_SCOPE } : geoScope,
      });

      if (!result?.success) {
        throw new Error(result?.error || t('errGeneric'));
      }

      setFormSuccess(t('successCreated'));
      setFullName('');
      setPhone('+9627');
      setPassword('');
      setAdminRank('ASSISTANT_ADMIN');
      setAllowedSectors([...ALL_SECTOR_IDS]);
      setAllowedPermissions([...ALL_SUB_PERMISSION_IDS]);
      setGeoScopeState({ ...UNRESTRICTED_GEO_SCOPE });
      await onSuccess();
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

  return {
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
    allowedPermissions,
    setAllowedPermissions,
    geoScope,
    setGeoScope,
    showPassword,
    setShowPassword,
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    phoneValidation,
    isPhoneValid,
    handleCreateAdmin,
  };
}
