'use client';

import React from 'react';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';
import { AdminProfile } from '@/features/admin/types/admin-profile';
import { AdminGeoScope, AdminSectorId } from '@/features/admin/lib/admin-permissions';
import { AdminDeleteDialog } from './admin-delete-dialog';
import { AdminPermissionsDialog } from './admin-permissions-dialog';

interface AdminModalsProps {
  t: any;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  deleteTarget: AdminProfile | null;
  setDeleteTarget: (target: AdminProfile | null) => void;
  deleting: boolean;
  onDeleteAdmin: () => void;
  editPermissionsTarget: AdminProfile | null;
  setEditPermissionsTarget: (target: AdminProfile | null) => void;
  editRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  setEditRank: (rank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN') => void;
  editSectors: AdminSectorId[];
  setEditSectors: React.Dispatch<React.SetStateAction<AdminSectorId[]>>;
  editPermissions: string[];
  setEditPermissions: React.Dispatch<React.SetStateAction<string[]>>;
  editGeoScope: AdminGeoScope;
  setEditGeoScope: React.Dispatch<React.SetStateAction<AdminGeoScope>>;
  geoLookup: GeoLookup;
  savingPermissions: boolean;
  onSavePermissions: () => void;
}

export function AdminModals(props: AdminModalsProps) {
  return (
    <>
      <AdminDeleteDialog
        t={props.t}
        isArabic={props.isArabic}
        direction={props.direction}
        deleteTarget={props.deleteTarget}
        setDeleteTarget={props.setDeleteTarget}
        deleting={props.deleting}
        onDeleteAdmin={props.onDeleteAdmin}
      />
      <AdminPermissionsDialog
        t={props.t}
        isArabic={props.isArabic}
        direction={props.direction}
        editPermissionsTarget={props.editPermissionsTarget}
        setEditPermissionsTarget={props.setEditPermissionsTarget}
        editRank={props.editRank}
        setEditRank={props.setEditRank}
        editSectors={props.editSectors}
        setEditSectors={props.setEditSectors}
        editPermissions={props.editPermissions}
        setEditPermissions={props.setEditPermissions}
        editGeoScope={props.editGeoScope}
        setEditGeoScope={props.setEditGeoScope}
        geoLookup={props.geoLookup}
        savingPermissions={props.savingPermissions}
        onSavePermissions={props.onSavePermissions}
      />
    </>
  );
}

export { AdminDeleteDialog, AdminPermissionsDialog };
