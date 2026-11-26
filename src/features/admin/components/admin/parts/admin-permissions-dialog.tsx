'use client';

import React from 'react';
import { Loader2, ShieldCheck, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';
import { AdminGeoScope, AdminSectorId } from '@/features/admin/lib/admin-permissions';
import { AdminProfile } from '@/features/admin/types/admin-profile';
import { AdminSectorSelector } from './admin-sector-selector';
import { AdminGeoScopePicker } from './admin-geo-scope-picker';

interface AdminPermissionsDialogProps {
  t: any;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
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

export function AdminPermissionsDialog({
  t,
  isArabic,
  direction,
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
  geoLookup,
  savingPermissions,
  onSavePermissions,
}: AdminPermissionsDialogProps) {
  return (
    <Dialog open={!!editPermissionsTarget} onOpenChange={(open) => !open && setEditPermissionsTarget(null)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0B0F19] border border-teal-500/30 text-white shadow-2xl rounded-2xl p-6" dir={direction}>
        <DialogHeader className={cn('space-y-1.5', isArabic ? 'text-right' : 'text-left')}>
          <div className="flex items-center gap-2 text-teal-400">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <Sliders className="w-5 h-5 text-teal-400" />
            </div>
            <DialogTitle className="text-base font-black text-white">
              {isArabic ? 'تعديل الصلاحيات والنطاق الجغرافي للمشرف' : 'Edit Supervisor Permissions & Territory'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-xs">
            {isArabic
              ? 'حدد القطاعات، الصلاحيات الفرعية داخل كل قطاع، والنطاق الجغرافي المصرح به لهذا المشرف.'
              : 'Configure authorized sectors, granular sub-permissions per sector, and geographic territory.'}
          </DialogDescription>
        </DialogHeader>

        {editPermissionsTarget && (
          <div className="space-y-4 my-2">
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white text-sm">{editPermissionsTarget.full_name}</p>
                <p className="font-mono text-slate-400 text-[11px]" dir="ltr">{editPermissionsTarget.phone}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  editPermissionsTarget.admin_rank === 'GENERAL_ADMIN'
                    ? 'border-amber-500/40 text-amber-300'
                    : 'border-cyan-500/40 text-cyan-300'
                }
              >
                {editPermissionsTarget.admin_rank === 'GENERAL_ADMIN' ? t('generalAdmin') : t('assistantAdmin')}
              </Badge>
            </div>

            <AdminSectorSelector
              t={t}
              isArabic={isArabic}
              adminRank={editRank}
              setAdminRank={setEditRank}
              allowedSectors={editSectors}
              setAllowedSectors={setEditSectors}
              allowedPermissions={editPermissions}
              setAllowedPermissions={setEditPermissions}
            />

            {editRank === 'ASSISTANT_ADMIN' && (
              <AdminGeoScopePicker
                isArabic={isArabic}
                geoLookup={geoLookup}
                geoScope={editGeoScope}
                setGeoScope={setEditGeoScope}
              />
            )}
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:justify-start pt-3 border-t border-white/10">
          <Button
            type="button"
            onClick={onSavePermissions}
            disabled={savingPermissions || !editPermissionsTarget}
            className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm h-10 rounded-xl transition-all shadow-lg shadow-teal-950/40 cursor-pointer"
          >
            {savingPermissions ? (
              <>
                <Loader2 className={cn('w-4 h-4 animate-spin', isArabic ? 'ml-2' : 'mr-2')} />
                {t('saving')}
              </>
            ) : (
              <>
                <ShieldCheck className={cn('w-4 h-4', isArabic ? 'ml-1.5' : 'mr-1.5')} />
                <span>{isArabic ? 'حفظ الصلاحيات والنطاق' : 'Save Permissions & Territory'}</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditPermissionsTarget(null)}
            disabled={savingPermissions}
            className="border-white/10 text-slate-300 hover:bg-white/5 h-10 rounded-xl text-xs cursor-pointer"
          >
            {t('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
