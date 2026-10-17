'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  UserRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface AdminProfile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  status: string;
  created_at: string;
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
  label: "block text-[11px] font-bold text-slate-300 mb-1 text-right",
  input: "w-full min-h-10 rounded-xl border border-white/10 bg-black/50 px-3 text-xs font-semibold text-white outline-none focus:border-[#14B8A6] transition text-right",
  tableCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/90 overflow-hidden shadow-xl",
  tableHead: "border-b border-white/10 bg-black/40 text-slate-300 text-xs font-bold",
  tableRow: "border-b border-white/5 transition hover:bg-white/[0.02]",
  avatar: "flex h-8 w-8 items-center justify-center rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] font-black border border-[#14B8A6]/30 text-xs",
  statusBadge: "inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg",
} as const;

export function AdminsManagementPanel() {
  const t = useTranslations('adminAdmins');
  const tAuto = useTranslations('auto');

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+9627');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/list-admins', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (data?.success && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error('[AdminsManagementPanel] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAdmins();
  }, [fetchAdmins]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/create-sub-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          password,
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

  return (
    <div className={styles.root} dir="rtl">
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
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            {t('activeAdmins')}
          </p>
          <p className={styles.statValue}>{admins.filter(a => (a.status || 'active').toLowerCase() !== 'blocked').length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statTitle}>
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            {t('accessTier')}
          </p>
          <p className="text-sm font-black text-[#14B8A6] mt-2">{t('sovereignTier')}</p>
        </div>
      </div>

      {/* Action Header */}
      <div className={styles.header}>
        <div>
          <h2 className="text-lg font-black text-[#F8FAFC] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#14B8A6]" />
            {t('title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t('subtitle')}</p>
        </div>

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
      </div>

      {/* Add Admin Form */}
      {isAdding && (
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
              <table className="w-full text-right text-xs">
                <thead className={styles.tableHead}>
                  <tr>
                    <th className="px-4 py-3">{t('colName')}</th>
                    <th className="px-4 py-3">{t('colPhone')}</th>
                    <th className="px-4 py-3">{t('colRole')}</th>
                    <th className="px-4 py-3">{t('colStatus')}</th>
                    <th className="px-4 py-3">{t('colDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className={styles.tableRow}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={styles.avatar}>
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-[#F8FAFC]">{admin.full_name || t('unnamed')}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{admin.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-300" dir="ltr">
                        {admin.phone}
                      </td>

                      <td className="px-4 py-3">
                        <Badge className="bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30 text-[10px] font-bold">
                          {t('roleBadge')}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <span className={styles.statusBadge}>
                          <CheckCircle2 className="h-3 w-3" />
                          {t('activeStatus')}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-400 text-[11px] font-mono">
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString('ar-JO') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

