'use client';

import React from 'react';
import { Check, Crown, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ADMIN_SECTORS,
  ALL_SECTOR_IDS,
  ALL_SUB_PERMISSION_IDS,
  AdminSectorId,
  deriveSectorsFromPermissions,
  getSubPermissionsForSector,
} from '@/features/admin/lib/admin-permissions';
import { AdminSubPermissionsPanel } from './admin-sub-permissions-panel';

interface AdminSectorSelectorProps {
  t: any;
  isArabic: boolean;
  adminRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  setAdminRank: (rank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN') => void;
  allowedSectors: AdminSectorId[];
  setAllowedSectors: React.Dispatch<React.SetStateAction<AdminSectorId[]>>;
  allowedPermissions: string[];
  setAllowedPermissions: React.Dispatch<React.SetStateAction<string[]>>;
}

export function AdminSectorSelector({
  t,
  isArabic,
  adminRank,
  setAdminRank,
  allowedSectors,
  setAllowedSectors,
  allowedPermissions,
  setAllowedPermissions,
}: AdminSectorSelectorProps) {
  const toggleSector = (sectorId: AdminSectorId) => {
    const sectorPermIds = getSubPermissionsForSector(sectorId).map((p) => p.id);
    const isChecked = allowedSectors.includes(sectorId);
    if (isChecked) {
      setAllowedSectors((prev) => prev.filter((id) => id !== sectorId));
      setAllowedPermissions((prev) => prev.filter((p) => !sectorPermIds.includes(p)));
    } else {
      setAllowedSectors((prev) => Array.from(new Set([...prev, sectorId])));
      setAllowedPermissions((prev) => Array.from(new Set([...prev, ...sectorPermIds])));
    }
  };

  const toggleSubPermission = (sectorId: AdminSectorId, permId: string) => {
    const isGranted = allowedPermissions.includes(permId);
    const nextPerms = isGranted
      ? allowedPermissions.filter((p) => p !== permId)
      : [...allowedPermissions, permId];
    setAllowedPermissions(nextPerms);
    const syncedSectors = deriveSectorsFromPermissions(nextPerms) as AdminSectorId[];
    setAllowedSectors((prev) =>
      syncedSectors.includes(sectorId)
        ? Array.from(new Set([...prev, sectorId]))
        : prev.filter((id) => id !== sectorId)
    );
  };

  const toggleAllInSector = (sectorId: AdminSectorId, grantAll: boolean) => {
    const sectorPermIds = getSubPermissionsForSector(sectorId).map((p) => p.id);
    if (grantAll) {
      setAllowedPermissions((prev) => Array.from(new Set([...prev, ...sectorPermIds])));
      setAllowedSectors((prev) => Array.from(new Set([...prev, sectorId])));
    } else {
      setAllowedPermissions((prev) => prev.filter((p) => !sectorPermIds.includes(p)));
      setAllowedSectors((prev) => prev.filter((id) => id !== sectorId));
    }
  };

  return (
    <>
      <div className="space-y-2 pt-2 border-t border-white/5">
        <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('adminRankLabel')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAdminRank('ASSISTANT_ADMIN')}
            className={`p-3.5 rounded-xl border text-start transition-all flex items-start gap-3 cursor-pointer ${
              adminRank === 'ASSISTANT_ADMIN'
                ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50'
                : 'border-white/10 bg-black/40 hover:border-white/20'
            }`}
          >
            <div className={`p-2 rounded-lg mt-0.5 ${adminRank === 'ASSISTANT_ADMIN' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'}`}>
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white">{t('assistantAdmin')}</p>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-none text-[9px] py-0 px-1.5">{t('recommendedBadge')}</Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('assistantAdminDesc')}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminRank('GENERAL_ADMIN');
              setAllowedSectors([...ALL_SECTOR_IDS]);
              setAllowedPermissions([...ALL_SUB_PERMISSION_IDS]);
            }}
            className={`p-3.5 rounded-xl border text-start transition-all flex items-start gap-3 cursor-pointer ${
              adminRank === 'GENERAL_ADMIN'
                ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                : 'border-white/10 bg-black/40 hover:border-white/20'
            }`}
          >
            <div className={`p-2 rounded-lg mt-0.5 ${adminRank === 'GENERAL_ADMIN' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'}`}>
              <Crown className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white">{t('generalAdmin')}</p>
                <Badge className="bg-amber-500/20 text-amber-300 border-none text-[9px] py-0 px-1.5">{t('sovereignBadge')}</Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('generalAdminDesc')}</p>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-300">
            {isArabic ? 'القطاعات وصلاحياتها التفصيلية المصرح بها:' : 'Authorized Sectors & Granular Permissions:'}
          </label>
          {adminRank === 'ASSISTANT_ADMIN' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAllowedSectors([...ALL_SECTOR_IDS]);
                  setAllowedPermissions([...ALL_SUB_PERMISSION_IDS]);
                }}
                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold transition cursor-pointer"
              >
                {isArabic ? 'تحديد الكل' : 'Select All'}
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => {
                  setAllowedSectors([]);
                  setAllowedPermissions([]);
                }}
                className="text-[10px] text-slate-400 hover:text-slate-300 font-bold transition cursor-pointer"
              >
                {isArabic ? 'إلغاء التحديد' : 'Deselect All'}
              </button>
            </div>
          )}
        </div>

        {adminRank === 'GENERAL_ADMIN' ? (
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-2 font-medium">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {isArabic
                ? 'المشرف العام يمتلك تلقائياً صلاحيات سيادية كاملة للوصول لجميع القطاعات والمناطق الجغرافية دون قيود.'
                : 'General Admin automatically possesses full sovereign access across all sectors and territories.'}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ADMIN_SECTORS.map((sector) => {
                const isChecked = allowedSectors.includes(sector.id as AdminSectorId);
                const sectorPerms = getSubPermissionsForSector(sector.id);
                const enabledCount = sectorPerms.filter((p) => allowedPermissions.includes(p.id)).length;
                return (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => toggleSector(sector.id as AdminSectorId)}
                    className={cn(
                      'p-2.5 rounded-xl border text-start transition flex items-center justify-between gap-2 cursor-pointer',
                      isChecked
                        ? 'bg-teal-500/15 border-teal-500/50 text-white shadow-sm ring-1 ring-teal-500/30'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          'w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all',
                          isChecked ? 'bg-[#14B8A6] border-[#14B8A6] text-[#0B0F19]' : 'border-white/20 bg-black/40'
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-bold truncate">
                        {isArabic ? sector.labelAr : sector.labelEn}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] font-mono shrink-0',
                        isChecked ? 'border-teal-500/40 text-teal-300' : 'border-white/10 text-slate-500'
                      )}
                    >
                      {enabledCount}/{sectorPerms.length}
                    </Badge>
                  </button>
                );
              })}
            </div>

            <AdminSubPermissionsPanel
              isArabic={isArabic}
              allowedSectors={allowedSectors}
              allowedPermissions={allowedPermissions}
              onToggleSubPermission={toggleSubPermission}
              onToggleAllInSector={toggleAllInSector}
            />
          </div>
        )}
      </div>
    </>
  );
}
