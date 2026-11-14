'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ALL_SECTOR_IDS } from '@/features/admin/lib/admin-permissions';
import { adminFetch } from '../lib/admin-api-client';
import { PRIMARY_SOVEREIGN_ADMIN_ID, PRIMARY_SOVEREIGN_ADMIN_PHONE } from '../components/admin/admins-management-panel';

export function useAdminViewPermissions() {
  const { user } = useAuth();

  const isCallerPrimary =
    user?.uid === PRIMARY_SOVEREIGN_ADMIN_ID ||
    user?.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE;

  const [callerAllowedSectors, setCallerAllowedSectors] = useState<string[]>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      return [...ALL_SECTOR_IDS];
    }
    return Array.isArray(user?.allowedSectors) ? user.allowedSectors : [...ALL_SECTOR_IDS];
  });

  const [callerRank, setCallerRank] = useState<string | null>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      return 'GENERAL_ADMIN';
    }
    return user?.adminRank || null;
  });

  const [permissionsLoaded, setPermissionsLoaded] = useState<boolean>(
    isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN'
  );

  useEffect(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      setPermissionsLoaded(true);
      return;
    }
    let active = true;
    adminFetch('/api/admin/list-admins')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.success) {
          if (data.callerRank === 'GENERAL_ADMIN') {
            setCallerRank('GENERAL_ADMIN');
            setCallerAllowedSectors([...ALL_SECTOR_IDS]);
          } else if (Array.isArray(data.callerAllowedSectors)) {
            setCallerRank(data.callerRank || 'ASSISTANT_ADMIN');
            setCallerAllowedSectors(data.callerAllowedSectors);
          }
        }
      })
      .catch((err) => {
        console.warn('[AdminViewTab] Failed to fetch caller permissions:', err);
      })
      .finally(() => {
        if (active) setPermissionsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [isCallerPrimary, user?.adminRank]);

  const isGeneral = isCallerPrimary || callerRank === 'GENERAL_ADMIN' || user?.adminRank === 'GENERAL_ADMIN';

  const canAccessSector = useCallback(
    (sectorId: string) => {
      if (isGeneral) return true;
      return callerAllowedSectors.includes(sectorId);
    },
    [isGeneral, callerAllowedSectors]
  );

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') return 'captains';
    if (Array.isArray(user?.allowedSectors) && user.allowedSectors.length > 0) {
      return user.allowedSectors[0];
    }
    return 'captains';
  });

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!canAccessSector(activeTab)) {
      const firstAllowed = ALL_SECTOR_IDS.find((id) => canAccessSector(id));
      if (firstAllowed) {
        setActiveTab(firstAllowed);
      }
    }
  }, [permissionsLoaded, canAccessSector, activeTab]);

  useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e.detail?.tab && canAccessSector(e.detail.tab)) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('admin-switch-tab', handleSwitch);
    return () => window.removeEventListener('admin-switch-tab', handleSwitch);
  }, [canAccessSector]);

  const totalVisibleTriggers = ALL_SECTOR_IDS.filter((id) => canAccessSector(id)).length + (isGeneral ? 1 : 0);

  return {
    isGeneral,
    canAccessSector,
    activeTab,
    setActiveTab,
    totalVisibleTriggers,
    permissionsLoaded,
  };
}
