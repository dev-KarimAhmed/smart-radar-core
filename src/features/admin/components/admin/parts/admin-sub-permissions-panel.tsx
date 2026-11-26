'use client';

import React from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ADMIN_SECTORS,
  AdminSectorId,
  getSubPermissionsForSector,
} from '@/features/admin/lib/admin-permissions';

interface AdminSubPermissionsPanelProps {
  isArabic: boolean;
  allowedSectors: AdminSectorId[];
  allowedPermissions: string[];
  onToggleSubPermission: (sectorId: AdminSectorId, permId: string) => void;
  onToggleAllInSector: (sectorId: AdminSectorId, grantAll: boolean) => void;
}

export function AdminSubPermissionsPanel({
  isArabic,
  allowedSectors,
  allowedPermissions,
  onToggleSubPermission,
  onToggleAllInSector,
}: AdminSubPermissionsPanelProps) {
  if (allowedSectors.length === 0) return null;

  return (
    <div className="space-y-2.5 pt-1">
      {ADMIN_SECTORS.filter((s) => allowedSectors.includes(s.id as AdminSectorId)).map((sector) => {
        const subPerms = getSubPermissionsForSector(sector.id);
        const activeCount = subPerms.filter((p) => allowedPermissions.includes(p.id)).length;
        return (
          <div
            key={sector.id}
            className="rounded-xl border border-teal-500/20 bg-[#0B0F19]/85 p-3 space-y-2.5 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-xs font-black text-white">
                  {isArabic ? `صلاحيات قسم ${sector.labelAr}` : `${sector.labelEn} Permissions`}
                </span>
                <Badge className="bg-teal-500/15 text-teal-300 border-none text-[10px]">
                  {activeCount}/{subPerms.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => onToggleAllInSector(sector.id as AdminSectorId, true)}
                  className="text-teal-400 hover:text-teal-300 font-bold cursor-pointer"
                >
                  {isArabic ? 'تحديد الكل' : 'All'}
                </button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => onToggleAllInSector(sector.id as AdminSectorId, false)}
                  className="text-slate-400 hover:text-rose-300 font-bold cursor-pointer"
                >
                  {isArabic ? 'إلغاء القسم' : 'Clear'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {subPerms.map((perm) => {
                const checked = allowedPermissions.includes(perm.id);
                return (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => onToggleSubPermission(sector.id as AdminSectorId, perm.id)}
                    className={cn(
                      'p-2 rounded-lg border text-start transition flex items-start gap-2 cursor-pointer',
                      checked
                        ? 'bg-cyan-500/10 border-cyan-500/35 text-slate-100'
                        : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200'
                    )}
                  >
                    <div
                      className={cn(
                        'w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center shrink-0',
                        checked ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-white/25 bg-black/50'
                      )}
                    >
                      {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold leading-tight">
                        {isArabic ? perm.labelAr : perm.labelEn}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                        {isArabic ? perm.descriptionAr : perm.descriptionEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
