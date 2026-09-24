'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

const MIN_PASSWORD_LENGTH = 8;

const copy = {
  ar: {
    title: 'تغيير كلمة المرور',
    description: 'يمكنك تعيين كلمة مرور جديدة لحسابك مباشرة في أي وقت.',
    newPasswordLabel: 'كلمة المرور الجديدة',
    newPasswordPlaceholder: '••••••••',
    confirmPasswordLabel: 'تأكيد كلمة المرور الجديدة',
    confirmPasswordPlaceholder: '••••••••',
    hint: `يجب أن تتكون كلمة المرور من ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`,
    mismatchError: 'كلمتا المرور غير متطابقتين.',
    tooShortError: `كلمة المرور يجب أن لا تقل عن ${MIN_PASSWORD_LENGTH} أحرف.`,
    submitButton: 'تحديث كلمة المرور',
    submitting: 'جاري تحديث كلمة المرور…',
    successTitle: 'تم تغيير كلمة المرور',
    successDesc: 'تم تحديث كلمة المرور الخاصة بحسابك بنجاح.',
    errorGeneric: 'تعذّر تغيير كلمة المرور. يرجى المحاولة مرة أخرى.',
  },
  en: {
    title: 'Change Password',
    description: 'Set a new password for your account directly at any time.',
    newPasswordLabel: 'New password',
    newPasswordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Confirm new password',
    confirmPasswordPlaceholder: '••••••••',
    hint: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    mismatchError: 'Passwords do not match.',
    tooShortError: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    submitButton: 'Update password',
    submitting: 'Updating password…',
    successTitle: 'Password changed',
    successDesc: 'Your account password has been updated successfully.',
    errorGeneric: 'Could not update password. Please try again.',
  },
} as const;

export function RiderChangePasswordCard() {
  const { isArabic } = useDashboardLanguage();
  const t = copy[isArabic ? 'ar' : 'en'];
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(t.tooShortError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t.mismatchError);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMessage(t.successDesc);
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: t.successTitle,
        description: t.successDesc,
      });
    } catch (err: any) {
      const msg = err?.message || t.errorGeneric;
      setErrorMessage(msg);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-2xl backdrop-blur-xl">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-extrabold text-[#14F5D5]">
          <Lock className="h-5 w-5 text-[#14B8A6]" />
          {t.title}
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          {t.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <p className="text-[10px] text-slate-500">{t.hint}</p>
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

          {successMessage ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 p-3 text-xs font-bold leading-relaxed text-[#14F5D5]">
              <CheckCircle2 className="h-4 w-4 text-[#14F5D5] shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-bold leading-relaxed text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting || !newPassword || !confirmPassword}
            className="w-full h-11 gap-2 rounded-xl bg-[#14B8A6] font-bold text-[#0B0F19] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#0fa596] disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#0B0F19]" />
                <span>{t.submitting}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-[#0B0F19]" />
                <span>{t.submitButton}</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
