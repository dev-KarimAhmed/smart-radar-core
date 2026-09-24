'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, KeyRound, Loader2, Mail, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useRecoveryEmail } from '@/features/auth/hooks/use-recovery-email';
import { useToast } from '@/hooks/use-toast';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

const copy = {
  ar: {
    title: 'استرجاع كلمة المرور عبر الإيميل',
    description: 'أرسل رابطاً آمناً إلى بريدك الإلكتروني لتعيين كلمة مرور جديدة لحسابك.',
    linkedEmail: 'البريد الإلكتروني المرتبط:',
    noEmailLinked: 'لم يتم ربط بريد إلكتروني بحسابك بعد. أدخل بريدك لإرسال رابط الاسترجاع وحفظه.',
    emailPlaceholder: 'you@example.com',
    sendButton: 'إرسال رابط استرجاع كلمة المرور',
    sending: 'جاري إرسال الرابط…',
    successTitle: 'تم إرسال الرابط بنجاح',
    successDesc: (email: string) => `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}. تفقّد صندوق الوارد أو مجلد الرسائل غير المرغوب فيها (Spam).`,
    errorEmpty: 'يرجى إدخال بريد إلكتروني صالح أولاً.',
    errorGeneric: 'تعذّر إرسال رابط استرجاع كلمة المرور. تأكد من صحة البريد أو حاول لاحقاً.',
  },
  en: {
    title: 'Password Reset via Email',
    description: 'Send a secure link to your email to reset your account password.',
    linkedEmail: 'Linked email address:',
    noEmailLinked: 'No email is linked to your account yet. Enter your email to send the reset link and save it.',
    emailPlaceholder: 'you@example.com',
    sendButton: 'Send password reset link',
    sending: 'Sending link…',
    successTitle: 'Link sent successfully',
    successDesc: (email: string) => `A password reset link has been sent to ${email}. Please check your inbox or spam folder.`,
    errorEmpty: 'Please enter a valid email address.',
    errorGeneric: 'Failed to send password reset link. Please check the address or try again later.',
  },
} as const;

export function RiderPasswordResetCard() {
  const { isArabic } = useDashboardLanguage();
  const t = copy[isArabic ? 'ar' : 'en'];
  const { toast } = useToast();
  const { currentEmail, save: saveRecoveryEmail } = useRecoveryEmail();

  const [inputEmail, setInputEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const targetEmail = (inputEmail.trim() || currentEmail.trim()).toLowerCase();

  const handleSendResetEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      setErrorMessage(t.errorEmpty);
      return;
    }

    setIsSending(true);

    try {
      if (inputEmail.trim() && inputEmail.trim().toLowerCase() !== currentEmail.toLowerCase()) {
        try {
          await saveRecoveryEmail(inputEmail.trim());
        } catch {
          // Continue attempting to send reset email even if save had issues
        }
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      const successText = t.successDesc(targetEmail);
      setSuccessMessage(successText);
      toast({
        title: t.successTitle,
        description: successText,
      });
    } catch (err: any) {
      const message = err?.message || t.errorGeneric;
      setErrorMessage(message);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-2xl backdrop-blur-xl">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-extrabold text-[#14F5D5]">
          <KeyRound className="h-5 w-5 text-[#14B8A6]" />
          {t.title}
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          {t.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {currentEmail ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#14B8A6]/20 bg-black/40 p-3">
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
              className="text-[11px] font-bold text-slate-400 hover:text-[#14F5D5] transition-colors"
            >
              {isArabic ? (inputEmail ? 'إلغاء الإيميل المخصص' : 'استخدام إيميل مختلف؟') : (inputEmail ? 'Cancel custom email' : 'Use a different email?')}
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
          type="button"
          onClick={() => void handleSendResetEmail()}
          disabled={isSending || (!currentEmail && !inputEmail.trim())}
          className="w-full h-11 gap-2 rounded-xl bg-[#14B8A6] font-bold text-[#0B0F19] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#0fa596] disabled:opacity-50 transition-all"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#0B0F19]" />
              <span>{t.sending}</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4 text-[#0B0F19]" />
              <span>{t.sendButton}</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
