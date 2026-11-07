'use client';

import React from 'react';
import {
  ShieldCheck,
  Shield,
  Crown,
  UserPlus,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  type AdminProfile,
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
  adminPanelStyles as styles,
} from './admins/admins-types';
import { useAdminsManagement } from './admins/use-admins-management';
import { CreateAdminForm } from './admins/create-admin-form';
import { AdminTableRow } from './admins/admin-table-row';
import { DeleteAdminDialog } from './admins/delete-admin-dialog';
import { EditPermissionsDialog } from './admins/edit-permissions-dialog';

export { PRIMARY_SOVEREIGN_ADMIN_ID, PRIMARY_SOVEREIGN_ADMIN_PHONE };
export type { AdminProfile };

export function AdminsManagementPanel() {
  const {
    t,
    tAuto,
    isArabic,
    direction,
    user,
    admins,
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
    handleCreateAdmin,
    handleSavePermissions,
    handleUpdateRank,
    handleDeleteAdmin,
  } = useAdminsManagement();

  return (
    <div className={cn(styles.root, isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* Top metrics summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statTitle}>
            <Users className="h-3.5 w-3.5 text-[#14B8A6]" />
            {t('totalAdmins')}
          </p>
          <p className={styles.statValue}>{admins.length}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statTitle}>
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            {t('generalAdmin')}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-amber-300 font-mono">{generalAdminsCount}</span>
            <span className="text-[10px] text-slate-400 font-medium">({t('generalAdminDesc')})</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statTitle}>
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            {t('callerRankTitle')}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {isGeneralAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Crown className="h-4 w-4 text-amber-400" />
                <span>{t('generalAdmin')} {t('fullPermissionsSuffix')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span>{t('assistantAdmin')} {t('restrictedPermissionsSuffix')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Assistant Admin Notice Banner if not general admin */}
      {!loading && !isGeneralAdmin && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-xs font-bold text-cyan-300">
          <Info className="h-4 w-4 shrink-0 text-cyan-400" />
          <span>{t('noPermissionNotice')}</span>
        </div>
      )}

      {/* Global Action Feedback Message */}
      {actionFeedback && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-bold animate-in fade-in duration-200 ${
            actionFeedback.type === 'success'
              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Action Header */}
      <div className={styles.header}>
        <div>
          <h2 className="text-lg font-black text-[#F8FAFC] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#14B8A6]" />
            {t('title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t('subtitle')}</p>
        </div>

        {isGeneralAdmin ? (
          <button
            type="button"
            onClick={() => {
              setIsAdding((prev) => !prev);
              setFormError(null);
              setFormSuccess(null);
            }}
            className={styles.addBtn}
          >
            <UserPlus className="h-4 w-4" />
            <span>{isAdding ? t('closeForm') : t('addBtn')}</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-400">
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            <span>{t('exclusiveGeneralAdminPermission')}</span>
          </div>
        )}
      </div>

      {/* Add Admin Form */}
      {isAdding && isGeneralAdmin && (
        <CreateAdminForm
          fullName={fullName}
          setFullName={setFullName}
          phone={phone}
          setPhone={setPhone}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          adminRank={adminRank}
          setAdminRank={setAdminRank}
          allowedSectors={allowedSectors}
          setAllowedSectors={setAllowedSectors}
          submitting={submitting}
          formError={formError}
          formSuccess={formSuccess}
          onClose={() => setIsAdding(false)}
          onSubmit={handleCreateAdmin}
          isArabic={isArabic}
          t={t}
        />
      )}

      {/* Admins Table */}
      <Card className={styles.tableCard}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-[#14B8A6]" />
              <p className="text-xs">{tAuto('key_7588d11e')}</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <ShieldCheck className="h-8 w-8 text-slate-600" />
              <p className="text-xs">{t('noAdmins')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className="px-4 py-3">{t('colName')}</th>
                    <th className="px-4 py-3">{t('colPhone')}</th>
                    <th className="px-4 py-3">{t('colRole')}</th>
                    <th className="px-4 py-3">{isArabic ? 'صلاحيات القطاعات' : 'Sectors'}</th>
                    <th className="px-4 py-3">{t('colStatus')}</th>
                    <th className="px-4 py-3">{t('colDate')}</th>
                    {isGeneralAdmin && <th className="px-4 py-3 text-center">{t('colActions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <AdminTableRow
                      key={admin.id}
                      admin={admin}
                      callerId={callerId}
                      userUid={user?.uid}
                      userPhone={user?.phone}
                      isGeneralAdmin={isGeneralAdmin}
                      actionLoading={actionLoading}
                      onEditPermissions={(adm) => {
                        setEditPermissionsTarget(adm);
                        const targetRank = adm.admin_rank || 'ASSISTANT_ADMIN';
                        setEditRank(targetRank);
                        const currentSectors =
                          Array.isArray(adm.allowed_sectors) && adm.allowed_sectors.length > 0
                            ? (adm.allowed_sectors as any)
                            : targetRank === 'GENERAL_ADMIN'
                            ? []
                            : ['captains', 'riders'];
                        setEditSectors(currentSectors);
                      }}
                      onUpdateRank={handleUpdateRank}
                      onDelete={(adm) => setDeleteTarget(adm)}
                      isArabic={isArabic}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Admin Confirmation Modal */}
      <DeleteAdminDialog
        deleteTarget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirmDelete={handleDeleteAdmin}
        deleting={deleting}
        direction={direction}
        isArabic={isArabic}
        t={t}
      />

      {/* Edit Permissions Modal */}
      <EditPermissionsDialog
        editPermissionsTarget={editPermissionsTarget}
        onClose={() => setEditPermissionsTarget(null)}
        editRank={editRank}
        setEditRank={setEditRank}
        editSectors={editSectors}
        setEditSectors={setEditSectors}
        savingPermissions={savingPermissions}
        onSave={handleSavePermissions}
        direction={direction}
        isArabic={isArabic}
        t={t}
      />
    </div>
  );
}
