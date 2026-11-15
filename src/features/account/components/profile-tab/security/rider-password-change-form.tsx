'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { MIN_PASSWORD_LENGTH } from './rider-security-copy';

interface RiderPasswordChangeFormProps {
  t: {
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    hint: string;
    tooShortError: string;
    mismatchError: string;
    passwordSuccessDesc: string;
    successTitle: string;
    errorGeneric: string;
    submitting: string;
    submitButton: string;
  };
  isArabic: boolean;
}

export function RiderPasswordChangeForm({ t, isArabic }: RiderPasswordChangeFormProps) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(t.tooShortError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.mismatchError);
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(t.passwordSuccessDesc);
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: t.successTitle,
        description: t.passwordSuccessDesc,
      });
    } catch (err: any) {
      const msg = err?.message || t.errorGeneric;
      setPasswordError(msg);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-300">
          {t.newPasswordLabel}
        </label>
        <div className="relative">
          <Input
            type={showNewPassword ? 'text' : 'password'}
            dir="ltr"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t.newPasswordPlaceholder}
            className="pr-11 pl-4 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white cursor-pointer"
            tabIndex={-1}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 font-sans">{t.hint}</p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-300">
          {t.confirmPasswordLabel}
        </label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            dir="ltr"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t.confirmPasswordPlaceholder}
            className="pr-11 pl-4 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white cursor-pointer"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {passwordSuccess ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 p-3 text-xs font-bold leading-relaxed text-[#14F5D5]">
          <CheckCircle2 className="h-4 w-4 text-[#14F5D5] shrink-0 mt-0.5" />
          <span>{passwordSuccess}</span>
        </div>
      ) : null}

      {passwordError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-bold leading-relaxed text-rose-200">
          {passwordError}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmittingPassword || !newPassword || !confirmPassword}
        className="w-full h-12 gap-2.5 rounded-2xl bg-[#14B8A6] font-black text-sm text-[#0B0F19] shadow-lg shadow-[#14B8A6]/25 hover:bg-[#0fa596] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
      >
        {isSubmittingPassword ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin text-[#0B0F19]" />
            <span>{t.submitting}</span>
          </>
        ) : (
          <>
            <ShieldCheck className="h-4.5 w-4.5 text-[#0B0F19]" />
            <span>{t.submitButton}</span>
          </>
        )}
      </Button>
    </form>
  );
}

