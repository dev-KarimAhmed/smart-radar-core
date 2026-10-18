'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import {
  ShieldCheck,
  Shield,
  Crown,
  UserPlus,
  Users,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  UserRound,
  Trash2,
  ArrowUpRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';

export const PRIMARY_SOVEREIGN_ADMIN_ID = '70b4a26f-10ac-4888-8df6-c3a5ad824b8a';
export const PRIMARY_SOVEREIGN_ADMIN_PHONE = '+201551981922';

export interface AdminProfile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  status: string;
  created_at: string;
  admin_rank?: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  admin_rank_label?: string;
  is_primary?: boolean;
}

const styles = {
  root: "space-y-6",
  statsGrid: "grid grid-cols-1 gap-3 sm:grid-cols-3",
  statCard: "rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg",
  statTitle: "text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5",
  statValue: "text-2xl font-black text-[#F8FAFC] font-mono",
  header: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2",
  addBtn: "inline-flex items-center justify-center gap-2 rounded-xl bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] px-4 py-2 text-xs font-black transition-all shadow-[0_4px_20px_rgba(20,184,166,0.25)] active:scale-95 cursor-pointer",
  formModal: "rounded-2xl border border-[#14B8A6]/30 bg-[#0B0F19]/95 p-5 shadow-2xl backdrop-blur-xl space-y-4 animate-in fade-in slide-in-from-top-3 duration-200",
  formTitle: "text-sm font-black text-white flex items-center justify-between border-b border-white/10 pb-3",
  formGrid: "grid grid-cols-1 gap-3 sm:grid-cols-3",
  label: "block text-[11px] font-bold text-slate-300 mb-1 text-start",
  input: "w-full min-h-10 rounded-xl border border-white/10 bg-black/50 px-3 text-xs font-semibold text-white outline-none focus:border-[#14B8A6] transition text-start",
  tableCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/90 overflow-hidden shadow-xl",
  tableHead: "border-b border-white/10 bg-black/40 text-slate-300 text-xs font-bold",
  tableRow: "border-b border-white/5 transition hover:bg-white/[0.02]",
  avatar: "flex h-8 w-8 items-center justify-center rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] font-black border border-[#14B8A6]/30 text-xs",
  statusBadge: "inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg",
} as const;

export function AdminsManagementPanel() {
  const t = useTranslations('adminAdmins');
  const tAuto = useTranslations('auto');
  const { isArabic, direction } = useDashboardLanguage();
  const { user } = useAuth();

  const isCallerPrimary =
    user?.uid === PRIMARY_SOVEREIGN_ADMIN_ID ||
    user?.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE;

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [callerRank, setCallerRank] = useState<'GENERAL_ADMIN' | 'ASSISTANT_ADMIN' | null>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      return 'GENERAL_ADMIN';
    }
    return user?.adminRank || null;
  });
  const [callerId, setCallerId] = useState<string | null>(user?.uid || null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+9627');
  const [password, setPassword] = useState('');
  const [adminRank, setAdminRank] = useState<'GENERAL_ADMIN' | 'ASSISTANT_ADMIN'>('ASSISTANT_ADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Actions & Dialog state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isGeneralAdmin =
    callerRank === 'GENERAL_ADMIN' ||
    isCallerPrimary ||
    user?.adminRank === 'GENERAL_ADMIN';

  useEffect(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      setCallerRank('GENERAL_ADMIN');
    }
    if (user?.uid && !callerId) {
      setCallerId(user.uid);
    }
  }, [isCallerPrimary, user?.adminRank, user?.uid, callerId]);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/list-admins');
      const data = await res.json();
      if (data?.success && Array.isArray(data.admins)) {
        setAdmins(data.admins);
        if (isCallerPrimary) {
          setCallerRank('GENERAL_ADMIN');
        } else if (data.callerRank) {
          setCallerRank(data.callerRank);
        }
        if (data.callerId) {
          setCallerId(data.callerId);
        } else if (user?.uid) {
          setCallerId(user.uid);
        }
      }
    } catch (err) {
      console.error('[AdminsManagementPanel] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isCallerPrimary, user?.uid]);

  useEffect(() => {
    void fetchAdmins();
  }, [fetchAdmins]);

  // Handle Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGeneralAdmin) return;
    setFormError(null);
    setFormSuccess(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setFormError(t('errName'));
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setFormError(t('errPhone'));
      return;
    }
    if (!password || password.length < 8) {
      setFormError(t('errPassword'));
      return;
    }

    try {
      setSubmitting(true);
      const res = await adminFetch('/api/admin/create-sub-admin', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          password,
          adminRank,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result?.error || t('errGeneric'));
      }

      setFormSuccess(t('successCreated'));
      setFullName('');
      setPhone('+9627');
      setPassword('');
      setAdminRank('ASSISTANT_ADMIN');
      await fetchAdmins();
      setTimeout(() => {
        setIsAdding(false);
        setFormSuccess(null);
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || t('errGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Update Admin Rank
  const handleUpdateRank = async (targetAdmin: AdminProfile, newRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN') => {
    if (!isGeneralAdmin || targetAdmin.is_primary) return;
    try {
      setActionLoading(targetAdmin.id);
      setActionFeedback(null);
      const res = await adminFetch('/api/admin/update-admin-rank', {
        method: 'POST',
        body: JSON.stringify({
          targetAdminId: targetAdmin.id,
          newRank,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result?.error || t('errGeneric'));
      }

      setActionFeedback({ type: 'success', message: t('rankUpdatedSuccess') });
      await fetchAdmins();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || t('errGeneric') });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Confirm Delete Admin
  const handleDeleteAdmin = async () => {
    if (!deleteTarget || !isGeneralAdmin || deleteTarget.is_primary || deleteTarget.id === callerId) return;
    try {
      setDeleting(true);
      setActionFeedback(null);
      const res = await adminFetch('/api/admin/delete-admin', {
        method: 'POST',
        body: JSON.stringify({
          targetAdminId: deleteTarget.id,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result?.error || t('errGeneric'));
      }

      setActionFeedback({ type: 'success', message: t('adminDeletedSuccess') });
      setDeleteTarget(null);
      await fetchAdmins();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || t('errGeneric') });
    } finally {
      setDeleting(false);
    }
  };

  const generalAdminsCount = admins.filter(
    a => a.admin_rank === 'GENERAL_ADMIN' || a.is_primary || a.id === PRIMARY_SOVEREIGN_ADMIN_ID || a.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE
  ).length;
  const assistantAdminsCount = Math.max(0, admins.length - generalAdminsCount);

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
              setIsAdding(prev => !prev);
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

      {/* Add Admin Form (Available only to GENERAL_ADMIN) */}
      {isAdding && isGeneralAdmin && (
        <form onSubmit={handleCreateAdmin} className={styles.formModal}>
          <div className={styles.formTitle}>
            <span className="flex items-center gap-1.5 text-sm font-bold text-[#14B8A6]">
              <UserPlus className="h-4 w-4" />
              {t('formHeader')}
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className={styles.formGrid}>
            <div>
              <label className={styles.label}>{t('fullNameLabel')}</label>
              <Input
                type="text"
                placeholder={t('fullNamePlaceholder')}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div>
              <label className={styles.label}>{t('phoneLabel')}</label>
              <Input
                type="tel"
                dir="ltr"
                placeholder="+962790000000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className="relative">
              <label className={styles.label}>{t('passwordLabel')}</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${styles.input} pl-9`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#14B8A6] transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Admin Rank Selector */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className={styles.label}>{t('adminRankLabel')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option: Assistant Admin */}
              <button
                type="button"
                onClick={() => setAdminRank('ASSISTANT_ADMIN')}
                className={`p-3.5 rounded-xl border text-start transition-all flex items-start gap-3 ${
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

              {/* Option: General Admin */}
              <button
                type="button"
                onClick={() => setAdminRank('GENERAL_ADMIN')}
                className={`p-3.5 rounded-xl border text-start transition-all flex items-start gap-3 ${
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

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={styles.addBtn}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t('confirmSubmit')}</span>
                </>
              )}
            </button>
          </div>
        </form>
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
                    <th className="px-4 py-3">{t('colStatus')}</th>
                    <th className="px-4 py-3">{t('colDate')}</th>
                    {isGeneralAdmin && <th className="px-4 py-3 text-center">{t('colActions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => {
                    const isTargetPrimary =
                      admin.is_primary ||
                      admin.id === PRIMARY_SOVEREIGN_ADMIN_ID ||
                      admin.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE;
                    const isTargetGeneral = admin.admin_rank === 'GENERAL_ADMIN' || isTargetPrimary;
                    const isCallerHimself =
                      admin.id === callerId ||
                      (user?.uid && admin.id === user.uid) ||
                      (user?.phone && admin.phone === user.phone);
                    const canModify = isGeneralAdmin && !isTargetPrimary;
                    const canDelete = isGeneralAdmin && !isTargetPrimary && !isCallerHimself;

                    return (
                      <tr key={admin.id} className={styles.tableRow}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`${styles.avatar} ${isTargetGeneral ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : ''}`}>
                              {isTargetGeneral ? <Crown className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-[#F8FAFC]">{admin.full_name || t('unnamed')}</p>
                                {isCallerHimself && (
                                  <Badge className="bg-teal-500/20 text-teal-300 border-none text-[9px] py-0 px-1 font-sans">{t('youTag')}</Badge>
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
                                <span className="text-[9px] bg-amber-400/20 text-amber-200 px-1 py-0.2 rounded font-sans">{t('primaryTag')}</span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 rounded-xl">
                              <Shield className="h-3.5 w-3.5 text-cyan-400" />
                              <span>{t('assistantAdmin')}</span>
                            </span>
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
                              {/* Toggle Rank Button */}
                              {canModify ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={actionLoading === admin.id}
                                  onClick={() => handleUpdateRank(admin, isTargetGeneral ? 'ASSISTANT_ADMIN' : 'GENERAL_ADMIN')}
                                  className={`h-7 px-2.5 text-[10px] font-bold rounded-lg transition-all ${
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
                                  onClick={() => setDeleteTarget(admin)}
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
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Admin Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-[#0B0F19] border border-rose-500/30 text-white shadow-2xl rounded-2xl" dir={direction}>
          <DialogHeader className={cn("space-y-2", isArabic ? "text-right" : "text-left")}>
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <DialogTitle className="text-lg font-black text-white">
                {t('deleteConfirmTitle')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-xs leading-relaxed">
              {t('deleteConfirmDesc')}
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className={cn("my-2 p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 text-xs", isArabic ? "text-right" : "text-left")}>
              <p className="text-slate-400 font-medium">{t('targetAdminInfo')}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-white">{deleteTarget.full_name}</span>
                <span className="font-mono text-slate-300" dir="ltr">{deleteTarget.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-slate-400 text-[11px]">
                <span>{t('rankLabel')}</span>
                <span className={deleteTarget.admin_rank === 'GENERAL_ADMIN' ? 'text-amber-300 font-bold' : 'text-cyan-300 font-bold'}>
                  {deleteTarget.admin_rank === 'GENERAL_ADMIN' ? t('generalAdmin') : t('assistantAdmin')}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 sm:justify-start pt-3 border-t border-white/10">
            <Button
              type="button"
              onClick={handleDeleteAdmin}
              disabled={deleting}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm h-10 rounded-xl transition-all shadow-lg shadow-rose-950/40"
            >
              {deleting ? (
                <>
                  <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                  {t('deleting')}
                </>
              ) : (
                <>
                  <Trash2 className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                  {t('confirmDelete')}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="border-white/10 text-slate-300 hover:bg-white/5 h-10 rounded-xl text-xs"
            >
              {t('cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
