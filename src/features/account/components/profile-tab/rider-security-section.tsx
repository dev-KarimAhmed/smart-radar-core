'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useRecoveryEmail } from '@/features/auth/hooks/use-recovery-email';
import { useToast } from '@/hooks/use-toast';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

const MIN_PASSWORD_LENGTH = 8;

const copy = {
  ar: {
    sectionTitle: 'مركز الأمان وكلمة المرور',
    sectionDesc: 'إدارة وتحديث كلمات المرور، وربط البريد الإلكتروني الآمن لاسترجاع الحساب بسهولة.',
    changeTab: 'تغيير كلمة المرور',
    resetTab: 'استرجاع الحساب بالإيميل',
    newPasswordLabel: 'كلمة المرور الجديدة',
    newPasswordPlaceholder: '••••••••',
    confirmPasswordLabel: 'تأكيد كلمة المرور الجديدة',
    confirmPasswordPlaceholder: '••••••••',
    hint: `يجب أن تتكون كلمة المرور من ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`,
    mismatchError: 'كلمتا المرور غير متطابقتين.',
    tooShortError: `كلمة المرور يجب أن لا تقل عن ${MIN_PASSWORD_LENGTH} أحرف.`,
    submitButton: 'تحديث كلمة المرور',
    submitting: 'جاري التحديث…',
    successTitle: 'تم التحديث بنجاح',
    passwordSuccessDesc: 'تم تغيير كلمة المرور لحسابك بنجاح.',
    errorGeneric: 'تعذّر إتمام العملية، يرجى المحاولة مرة أخرى.',
    linkedEmail: 'البريد الإلكتروني المرتبط بالحساب:',
    noEmailLinked: 'لم يتم ربط بريد إلكتروني بحسابك بعد. أدخل بريدك لإرسال رابط الاسترجاع وحفظه.',
    emailPlaceholder: 'you@example.com',
    sendResetButton: 'إرسال رابط إعادة تعيين الرمز',
    sendingLink: 'جاري إرسال الرابط…',
    resetLinkSuccess: (email: string) => `تم إرسال رابط آمن إلى ${email}. تفقّد صندوق الوارد أو الرسائل غير المرغوب فيها (Spam).`,
    emailErrorEmpty: 'يرجى إدخال بريد إلكتروني صالح أولاً.',
    useDifferentEmail: 'استخدام إيميل مختلف؟',
    cancelCustomEmail: 'إلغاء الإيميل المخصص',
  },
  en: {
    sectionTitle: 'Security & Access Center',
    sectionDesc: 'Manage your password, link a verified recovery email, and secure your account.',
    changeTab: 'Change Password',
    resetTab: 'Email Recovery',
    newPasswordLabel: 'New Password',
    newPasswordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Confirm New Password',
    confirmPasswordPlaceholder: '••••••••',
    hint: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    mismatchError: 'Passwords do not match.',
    tooShortError: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    submitButton: 'Update Password',
    submitting: 'Updating…',
    successTitle: 'Updated Successfully',
    passwordSuccessDesc: 'Your account password has been updated successfully.',
    errorGeneric: 'Could not complete action. Please try again.',
    linkedEmail: 'Linked Recovery Email:',
    noEmailLinked: 'No email linked to your account yet. Enter your email to send the reset link and save it.',
    emailPlaceholder: 'you@example.com',
    sendResetButton: 'Send Password Reset Link',
    sendingLink: 'Sending link…',
    resetLinkSuccess: (email: string) => `A secure reset link has been sent to ${email}. Please check your inbox or spam folder.`,
    emailErrorEmpty: 'Please enter a valid email address.',
    useDifferentEmail: 'Use a different email?',
    cancelCustomEmail: 'Cancel custom email',
  },
} as const;

export function RiderSecuritySection() {
  const { isArabic } = useDashboardLanguage();
  const t = copy[isArabic ? 'ar' : 'en'];
  const { toast } = useToast();
  const { currentEmail, save: saveRecoveryEmail } = useRecoveryEmail();

  const [activeSubTab, setActiveSubTab] = useState<'change' | 'reset'>('change');

  // Change password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Reset email states
  const [inputEmail, setInputEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const targetEmail = (inputEmail.trim() || currentEmail.trim()).toLowerCase();

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

  const handleSendResetEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetSuccess('');
    setResetError('');

    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      setResetError(t.emailErrorEmpty);
      return;
    }

    setIsSendingReset(true);

    try {
      if (inputEmail.trim() && inputEmail.trim().toLowerCase() !== currentEmail.toLowerCase()) {
        try {
          await saveRecoveryEmail(inputEmail.trim());
        } catch {
          // Continue reset dispatch
        }
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo,
      });

      if (error) throw error;

      const successText = t.resetLinkSuccess(targetEmail);
      setResetSuccess(successText);
      toast({
        title: t.successTitle,
        description: successText,
      });
    } catch (err: any) {
      const msg = err?.message || t.errorGeneric;
      setResetError(msg);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-2xl backdrop-blur-xl">
      {/* Top glowing accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />

      <CardHeader className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] shadow-sm">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-black text-white flex items-center gap-2">
              {t.sectionTitle}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {t.sectionDesc}
            </CardDescription>
          </div>
        </div>

        {/* Sub-tab Pill Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 mt-4 rounded-2xl border border-white/5 bg-black/40">
          <button
            type="button"
            onClick={() => setActiveSubTab('change')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'change'
                ? 'bg-[#14B8A6] text-[#0B0F19] shadow-md shadow-[#14B8A6]/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>{t.changeTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('reset')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'reset'
                ? 'bg-[#14B8A6] text-[#0B0F19] shadow-md shadow-[#14B8A6]/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>{t.resetTab}</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-3">
        {activeSubTab === 'change' ? (
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
                  className="pe-10 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-white cursor-pointer"
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
                  className="pe-10 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-white cursor-pointer"
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
              className="w-full h-11 gap-2 rounded-xl bg-[#14B8A6] font-bold text-[#0B0F19] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#0fa596] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmittingPassword ? (
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
        ) : (
          <div className="space-y-4">
            {currentEmail ? (
              <div className="flex items-center gap-2 rounded-xl border border-[#14B8A6]/20 bg-black/40 p-3.5">
                <Mail className="h-4 w-4 text-[#14F5D5] shrink-0" />
                <span className="text-xs text-slate-400">{t.linkedEmail}</span>
                <strong className="font-mono text-xs text-white ltr" dir="ltr">{currentEmail}</strong>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-400">{t.noEmailLinked}</p>
                <Input
                  type="email"
                  dir="ltr"
                  placeholder={t.emailPlaceholder}
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]"
                />
              </div>
            )}

            {currentEmail && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setInputEmail((prev) => (prev ? '' : currentEmail))}
                  className="text-[11px] font-bold text-slate-400 hover:text-[#14F5D5] transition-colors cursor-pointer"
                >
                  {inputEmail ? t.cancelCustomEmail : t.useDifferentEmail}
                </button>
                {inputEmail !== '' && (
                  <Input
                    type="email"
                    dir="ltr"
                    placeholder={t.emailPlaceholder}
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    className="mt-1.5 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white text-xs focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]"
                  />
                )}
              </div>
            )}

            {resetSuccess ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 p-3 text-xs font-bold leading-relaxed text-[#14F5D5]">
                <CheckCircle2 className="h-4 w-4 text-[#14F5D5] shrink-0 mt-0.5" />
                <span>{resetSuccess}</span>
              </div>
            ) : null}

            {resetError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-bold leading-relaxed text-rose-200">
                {resetError}
              </div>
            ) : null}

            <Button
              type="button"
              onClick={() => void handleSendResetEmail()}
              disabled={isSendingReset || (!currentEmail && !inputEmail.trim())}
              className="w-full h-11 gap-2 rounded-xl bg-[#14B8A6] font-bold text-[#0B0F19] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#0fa596] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSendingReset ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#0B0F19]" />
                  <span>{t.sendingLink}</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-[#0B0F19]" />
                  <span>{t.sendResetButton}</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

