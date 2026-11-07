'use client';

import React from 'react';
import {
  Crown,
  Shield,
  UserRound,
  Check,
  CheckCircle2,
  Sliders,
  ArrowUpRight,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ADMIN_SECTORS } from '@/features/admin/lib/admin-permissions';
import {
  type AdminProfile,
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
  adminPanelStyles as styles,
} from './admins-types';

interface AdminTableRowProps {
  admin: AdminProfile;
  callerId: string | null;
  userUid?: string;
  userPhone?: string;
  isGeneralAdmin: boolean;
  actionLoading: string | null;
  onEditPermissions: (admin: AdminProfile) => void;
  onUpdateRank: (admin: AdminProfile, newRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN') => Promise<void>;
  onDelete: (admin: AdminProfile) => void;
  isArabic: boolean;
  t: (key: string) => string;
}

export function AdminTableRow({
  admin,
  callerId,
  userUid,
  userPhone,
  isGeneralAdmin,
  actionLoading,
  onEditPermissions,
  onUpdateRank,
  onDelete,
  isArabic,
  t,
}: AdminTableRowProps) {
  const isTargetPrimary =
    admin.is_primary ||
    admin.id === PRIMARY_SOVEREIGN_ADMIN_ID ||
    admin.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE;
  const isTargetGeneral = admin.admin_rank === 'GENERAL_ADMIN' || isTargetPrimary;
  const isCallerHimself =
    admin.id === callerId ||
    (userUid && admin.id === userUid) ||
    (userPhone && admin.phone === userPhone);
  const canModify = isGeneralAdmin && !isTargetPrimary;
  const canDelete = isGeneralAdmin && !isTargetPrimary && !isCallerHimself;

  return (
    <tr key={admin.id} className={styles.tableRow}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`${styles.avatar} ${
              isTargetGeneral ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : ''
            }`}
          >
            {isTargetGeneral ? <Crown className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-[#F8FAFC]">{admin.full_name || t('unnamed')}</p>
              {isCallerHimself && (
                <Badge className="bg-teal-500/20 text-teal-300 border-none text-[9px] py-0 px-1 font-sans">
                  {t('youTag')}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">{admin.id.slice(0, 8)}...</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 font-mono text-slate-300" dir="ltr">
        {admin.phone}
      </td>

      {/* Admin Rank Badge */}
      <td className="px-4 py-3">
        {isTargetGeneral ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('generalAdmin')}</span>
            {isTargetPrimary && (
              <span className="text-[9px] bg-amber-400/20 text-amber-200 px-1 py-0.2 rounded font-sans">
                {t('primaryTag')}
              </span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 rounded-xl">
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            <span>{t('assistantAdmin')}</span>
          </span>
        )}
      </td>

      {/* Allowed Sectors Column */}
      <td className="px-4 py-3">
        {isTargetGeneral ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg shadow-sm">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>{isArabic ? 'كامل القطاعات (مشرف عام)' : 'All Sectors (General Admin)'}</span>
          </span>
        ) : (
          <div className="flex flex-wrap gap-1 max-w-[260px]">
            {Array.isArray(admin.allowed_sectors) && admin.allowed_sectors.length > 0 ? (
              admin.allowed_sectors.map((secId) => {
                const secDef = ADMIN_SECTORS.find((s) => s.id === secId);
                return (
                  <span
                    key={secId}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-300 inline-flex items-center gap-1"
                  >
                    <Check className="w-2.5 h-2.5 text-teal-400 stroke-[3]" />
                    <span>{isArabic ? secDef?.labelAr || secId : secDef?.labelEn || secId}</span>
                  </span>
                );
              })
            ) : (
              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                {isArabic ? 'لا توجد قطاعات مصرحة' : 'No Authorized Sectors'}
              </span>
            )}
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <span className={styles.statusBadge}>
          <CheckCircle2 className="h-3 w-3" />
          {t('activeStatus')}
        </span>
      </td>

      <td className="px-4 py-3 text-slate-400 text-[11px] font-mono">
        {admin.created_at ? new Date(admin.created_at).toLocaleDateString(isArabic ? 'ar-JO' : 'en-US') : '-'}
      </td>

      {/* Actions Column (General Admin only) */}
      {isGeneralAdmin && (
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-1.5">
            {/* Edit Permissions & Rank Button */}
            {canModify && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onEditPermissions(admin)}
                className="h-7 px-2.5 text-[10px] font-bold rounded-lg text-teal-300 hover:text-white hover:bg-teal-500/20 border border-teal-500/30 transition-all flex items-center gap-1 cursor-pointer"
                title={isArabic ? 'تعديل صلاحيات القطاعات والرتبة' : 'Edit Sector Permissions & Rank'}
              >
                <Sliders className="h-3 w-3 text-teal-400" />
                <span>{isArabic ? 'الصلاحيات' : 'Permissions'}</span>
              </Button>
            )}

            {/* Toggle Rank Button */}
            {canModify ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={actionLoading === admin.id}
                onClick={() =>
                  onUpdateRank(admin, isTargetGeneral ? 'ASSISTANT_ADMIN' : 'GENERAL_ADMIN')
                }
                className={`h-7 px-2 text-[10px] font-bold rounded-lg transition-all ${
                  isTargetGeneral
                    ? 'text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 border border-white/10'
                    : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/30'
                }`}
                title={isTargetGeneral ? t('demoteToAssistant') : t('promoteToGeneral')}
              >
                {actionLoading === admin.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isTargetGeneral ? (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-cyan-400" />
                    <span>{t('demoteToAssistantBtn')}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-amber-400" />
                    <span>{t('promoteToGeneralBtn')}</span>
                  </span>
                )}
              </Button>
            ) : (
              <span className="text-[10px] text-slate-500 font-sans px-2">
                {admin.is_primary ? t('primaryProtected') : '-'}
              </span>
            )}

            {/* Delete Admin Button */}
            {canDelete ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onDelete(admin)}
                className="h-7 w-7 p-0 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                title={t('deleteAdmin')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </td>
      )}
    </tr>
  );
}
