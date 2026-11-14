'use client';

import React from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AdminSectorId } from '@/features/admin/lib/admin-permissions';
import { AdminSectorSelector } from './admin-sector-selector';

interface AdminCreateFormProps {
  t: any;
  isArabic: boolean;
  isAdding: boolean;
  isGeneralAdmin: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formError: string | null;
  formSuccess: string | null;
  fullName: string;
  setFullName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  isPhoneValid: boolean;
  phoneValidationMessage?: string;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  adminRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  setAdminRank: (rank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN') => void;
  allowedSectors: AdminSectorId[];
  setAllowedSectors: React.Dispatch<React.SetStateAction<AdminSectorId[]>>;
  submitting: boolean;
}

export function AdminCreateForm({
  t,
  isArabic,
  isAdding,
  isGeneralAdmin,
  onClose,
  onSubmit,
  formError,
  formSuccess,
  fullName,
  setFullName,
  phone,
  setPhone,
  isPhoneValid,
  phoneValidationMessage,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  adminRank,
  setAdminRank,
  allowedSectors,
  setAllowedSectors,
  submitting,
}: AdminCreateFormProps) {
  if (!isAdding || !isGeneralAdmin) return null;

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[#14B8A6]/30 bg-[#161F30]/90 p-5 space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <span className="flex items-center gap-1.5 text-sm font-bold text-[#14B8A6]">
          <UserPlus className="h-4 w-4" />
          {t('formHeader')}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white transition cursor-pointer"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('fullNameLabel')}</label>
          <Input
            type="text"
            placeholder={t('fullNamePlaceholder')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-10 rounded-xl border-white/10 bg-[#0B0F19] text-xs text-white placeholder:text-slate-500 focus:border-[#14B8A6]"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('phoneLabel')}</label>
          <div className="relative">
            <Input
              type="tel"
              dir="ltr"
              placeholder="+962790000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={cn(
                "h-10 rounded-xl border-white/10 bg-[#0B0F19] text-xs text-white placeholder:text-slate-500 focus:border-[#14B8A6]",
                isPhoneValid && '!border-emerald-500/70 focus:!border-emerald-500 ring-1 ring-emerald-500/20',
                !isPhoneValid && phone.trim() && '!border-amber-500/60 focus:!border-amber-500'
              )}
              required
            />
            {isPhoneValid ? (
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
                <Check className="h-4 w-4 stroke-[2.5]" />
              </span>
            ) : null}
          </div>
          {!isPhoneValid ? (
            <p className="text-[11px] text-amber-400/90 font-medium mt-1">
              {phone.trim() ? (phoneValidationMessage || t('phoneInvalid')) : t('phoneLabel')}
            </p>
          ) : null}
        </div>

        <div className="relative">
          <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('passwordLabel')}</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-xl border-white/10 bg-[#0B0F19] text-xs text-white placeholder:text-slate-500 focus:border-[#14B8A6] pl-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#14B8A6] transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <AdminSectorSelector
        t={t}
        isArabic={isArabic}
        adminRank={adminRank}
        setAdminRank={setAdminRank}
        allowedSectors={allowedSectors}
        setAllowedSectors={setAllowedSectors}
      />

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-10 rounded-xl bg-[#14B8A6] px-5 text-xs font-black text-[#0B0F19] hover:bg-[#2DD4BF] transition shadow-[0_0_15px_rgba(20,184,166,0.2)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
  );
}
