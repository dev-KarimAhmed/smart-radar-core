'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
  AdminProfile,
} from '@/features/admin/types/admin-profile';
import { useAdminsManagement } from '@/features/admin/hooks/use-admins-management';
import { AdminsStatsHeader } from './parts/admins-stats-header';
import { AdminCreateForm } from './parts/admin-create-form';
import { AdminsListTable } from './parts/admins-list-table';
import { AdminModals } from './parts/admin-modals';

export { PRIMARY_SOVEREIGN_ADMIN_ID, PRIMARY_SOVEREIGN_ADMIN_PHONE };
export type { AdminProfile };

export function AdminsManagementPanel() {
  const { user } = useAuth();
  const state = useAdminsManagement();

  return (
    <div className={cn('space-y-6', state.isArabic ? 'text-right' : 'text-left')} dir={state.direction}>
      <AdminsStatsHeader
        t={state.t}
        adminsCount={state.admins.length}
        generalAdminsCount={state.generalAdminsCount}
        isGeneralAdmin={state.isGeneralAdmin}
        loading={state.loading}
        actionFeedback={state.actionFeedback}
        isAdding={state.isAdding}
        onToggleAdd={() => {
          state.setIsAdding((prev) => !prev);
          state.setFormError(null);
          state.setFormSuccess(null);
        }}
      />

      <AdminCreateForm
        t={state.t}
        isArabic={state.isArabic}
        isAdding={state.isAdding}
        isGeneralAdmin={state.isGeneralAdmin}
        onClose={() => state.setIsAdding(false)}
        onSubmit={state.handleCreateAdmin}
        formError={state.formError}
        formSuccess={state.formSuccess}
        fullName={state.fullName}
        setFullName={state.setFullName}
        phone={state.phone}
        setPhone={state.setPhone}
        isPhoneValid={state.isPhoneValid}
        phoneValidationMessage={state.phoneValidation.message}
        password={state.password}
        setPassword={state.setPassword}
        showPassword={state.showPassword}
        setShowPassword={state.setShowPassword}
        adminRank={state.adminRank}
        setAdminRank={state.setAdminRank}
        allowedSectors={state.allowedSectors}
        setAllowedSectors={state.setAllowedSectors}
        allowedPermissions={state.allowedPermissions}
        setAllowedPermissions={state.setAllowedPermissions}
        geoScope={state.geoScope}
        setGeoScope={state.setGeoScope}
        geoLookup={state.geoLookup}
        submitting={state.submitting}
      />

      <AdminsListTable
        t={state.t}
        isArabic={state.isArabic}
        loading={state.loading}
        admins={state.admins}
        geoLookup={state.geoLookup}
        isGeneralAdmin={state.isGeneralAdmin}
        callerId={state.callerId}
        currentUserId={user?.uid}
        currentUserPhone={user?.phone}
        actionLoading={state.actionLoading}
        onOpenEditPermissions={state.openEditPermissions}
        onUpdateRank={state.handleUpdateRank}
        onDeleteTarget={state.setDeleteTarget}
      />

      <AdminModals
        t={state.t}
        isArabic={state.isArabic}
        direction={state.direction}
        deleteTarget={state.deleteTarget}
        setDeleteTarget={state.setDeleteTarget}
        deleting={state.deleting}
        onDeleteAdmin={state.handleDeleteAdmin}
        editPermissionsTarget={state.editPermissionsTarget}
        setEditPermissionsTarget={state.setEditPermissionsTarget}
        editRank={state.editRank}
        setEditRank={state.setEditRank}
        editSectors={state.editSectors}
        setEditSectors={state.setEditSectors}
        editPermissions={state.editPermissions}
        setEditPermissions={state.setEditPermissions}
        editGeoScope={state.editGeoScope}
        setEditGeoScope={state.setEditGeoScope}
        geoLookup={state.geoLookup}
        savingPermissions={state.savingPermissions}
        onSavePermissions={state.handleSavePermissions}
      />
    </div>
  );
}

export default AdminsManagementPanel;
