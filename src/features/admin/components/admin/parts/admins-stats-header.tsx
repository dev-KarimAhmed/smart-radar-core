'use client';

import React from 'react';
import {
  Users,
  Crown,
  Shield,
  ShieldCheck,
  UserPlus,
  X,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminsStatsHeaderProps {
  t: any;
  adminsCount: number;
  generalAdminsCount: number;
  isGeneralAdmin: boolean;
  loading: boolean;
  actionFeedback: { type: 'success' | 'error'; message: string } | null;
  isAdding: boolean;
  onToggleAdd: () => void;
}

export function AdminsStatsHeader({
  t,
  adminsCount,
  generalAdminsCount,
  isGeneralAdmin,
  loading,
  actionFeedback,
  isAdding,
  onToggleAdd,
}: AdminsStatsHeaderProps) {
  return (
    <>
      {/* Top metrics summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#14B8A6]" />
            {t('totalAdmins')}
          </p>
          <p className="mt-1 text-2xl font-black text-white font-mono">{adminsCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            {t('generalAdmin')}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-amber-300 font-mono">{generalAdminsCount}</span>
            <span className="text-[10px] text-slate-400 font-medium">({t('generalAdminDesc')})</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#F8FAFC] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#14B8A6]" />
            {t('title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t('subtitle')}</p>
        </div>

        {isGeneralAdmin ? (
          <Button
            type="button"
            onClick={onToggleAdd}
            className={`min-h-10 rounded-xl px-4 text-xs font-black transition cursor-pointer ${
              isAdding
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-[#14B8A6] text-[#0B0F19] hover:bg-[#2DD4BF] shadow-[0_0_20px_rgba(20,184,166,0.3)]'
            }`}
          >
            {isAdding ? (
              <>
                <X className="h-4 w-4 me-1.5" />
                {t('cancel')}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 me-1.5" />
                {t('addAdminBtn')}
              </>
            )}
          </Button>
        ) : null}
      </div>
    </>
  );
}

