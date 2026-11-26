'use client';

import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';
import { AdminProfile } from '@/features/admin/types/admin-profile';
import { AdminsTableRow } from './admins-table-row';

interface AdminsListTableProps {
  t: any;
  isArabic: boolean;
  loading: boolean;
  admins: AdminProfile[];
  geoLookup: GeoLookup;
  isGeneralAdmin: boolean;
  callerId: string | null;
  currentUserId?: string;
  currentUserPhone?: string;
  actionLoading: string | null;
  onOpenEditPermissions: (admin: AdminProfile) => void;
  onUpdateRank: (admin: AdminProfile, rank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN') => void;
  onDeleteTarget: (admin: AdminProfile) => void;
}

export function AdminsListTable({
  t,
  isArabic,
  loading,
  admins,
  geoLookup,
  isGeneralAdmin,
  callerId,
  currentUserId,
  currentUserPhone,
  actionLoading,
  onOpenEditPermissions,
  onUpdateRank,
  onDeleteTarget,
}: AdminsListTableProps) {
  return (
    <Card className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 overflow-hidden shadow-2xl backdrop-blur-xl">
      <CardContent className="p-0">
        {loading ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#14B8A6]" />
            <p className="text-xs">{t('loadingAdmins') || '...'}</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-slate-400">
            <ShieldCheck className="h-8 w-8 text-slate-600" />
            <p className="text-xs">{t('noAdmins')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
              <thead className="border-b border-white/10 bg-white/5 text-slate-400 font-bold">
                <tr>
                  <th className="px-4 py-3">{t('colName')}</th>
                  <th className="px-4 py-3">{t('colPhone')}</th>
                  <th className="px-4 py-3">{t('colRole')}</th>
                  <th className="px-4 py-3">{isArabic ? 'صلاحيات القطاعات' : 'Sectors'}</th>
                  <th className="px-4 py-3">{isArabic ? 'النطاق الجغرافي' : 'Territory'}</th>
                  <th className="px-4 py-3">{t('colStatus')}</th>
                  <th className="px-4 py-3">{t('colDate')}</th>
                  {isGeneralAdmin && <th className="px-4 py-3 text-center">{t('colActions')}</th>}
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <AdminsTableRow
                    key={admin.id}
                    admin={admin}
                    geoLookup={geoLookup}
                    t={t}
                    isArabic={isArabic}
                    isGeneralAdmin={isGeneralAdmin}
                    callerId={callerId}
                    currentUserId={currentUserId}
                    currentUserPhone={currentUserPhone}
                    actionLoading={actionLoading}
                    onOpenEditPermissions={onOpenEditPermissions}
                    onUpdateRank={onUpdateRank}
                    onDeleteTarget={onDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
