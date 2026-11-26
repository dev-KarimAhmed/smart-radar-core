'use client';

import React, { createContext, useContext } from 'react';
import {
  ALL_SUB_PERMISSION_IDS,
  AdminGeoScope,
  UNRESTRICTED_GEO_SCOPE,
} from '@/features/admin/lib/admin-permissions';

export interface AdminPermissionsContextValue {
  isGeneral: boolean;
  canAccessSector: (sectorId: string) => boolean;
  hasPermission: (permId: string) => boolean;
  geoScope: AdminGeoScope;
}

const DEFAULT_CONTEXT: AdminPermissionsContextValue = {
  isGeneral: true,
  canAccessSector: () => true,
  hasPermission: (permId: string) => ALL_SUB_PERMISSION_IDS.includes(permId),
  geoScope: { ...UNRESTRICTED_GEO_SCOPE },
};

const AdminPermissionsContext = createContext<AdminPermissionsContextValue>(DEFAULT_CONTEXT);

export function AdminPermissionsProvider({
  value,
  children,
}: {
  value: AdminPermissionsContextValue;
  children: React.ReactNode;
}) {
  return (
    <AdminPermissionsContext.Provider value={value}>
      {children}
    </AdminPermissionsContext.Provider>
  );
}

export function useAdminPermissions() {
  return useContext(AdminPermissionsContext);
}
