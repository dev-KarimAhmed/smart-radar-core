'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import { useRecoveryEmail } from '@/features/auth/hooks/use-recovery-email';
import { requestPasswordRecovery } from '@/features/auth/services/password-recovery';
import { useToast } from '@/hooks/use-toast';

interface RiderEmailResetFormProps {
  t: {
    linkedEmail: string;
    noEmailLinked: string;
    emailPlaceholder: string;
    cancelCustomEmail: string;
    useDifferentEmail: string;
    sendingLink: string;
    sendResetButton: string;
    emailErrorEmpty: string;
    resetLinkSuccess: (email: string) => string;
    successTitle: string;
    errorGeneric: string;
  };
  isArabic: boolean;
}

export function RiderEmailResetForm({ t, isArabic }: RiderEmailResetFormProps) {
  const { toast } = useToast();
  const { currentEmail, currentPhone, save: saveRecoveryEmail } = useRecoveryEmail();

  const [inputEmail, setInputEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const targetEmail = (inputEmail.trim() || currentEmail.trim()).toLowerCase();

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

      const res = await requestPasswordRecovery(currentPhone, targetEmail);
      const successText = res.message || t.resetLinkSuccess(targetEmail);
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
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => setInputEmail((prev) => (prev ? '' : currentEmail))}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#14F5D5] hover:text-white transition-colors cursor-pointer py-1"
            >
              <Mail className="h-3.5 w-3.5 text-[#14F5D5]" />
              <span className="underline underline-offset-4 decoration-[#14F5D5]/50 hover:decoration-white">
                {inputEmail ? t.cancelCustomEmail : t.useDifferentEmail}
              </span>
            </button>
          </div>
          {inputEmail !== '' && (
            <div className="space-y-1">
              <Input
                type="email"
                dir="ltr"
                placeholder={t.emailPlaceholder}
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="rounded-xl border-[#14B8A6]/40 bg-black/60 text-white text-xs focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]"
              />
            </div>
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
        className="w-full h-12 gap-2.5 rounded-2xl border-2 border-[#14F5D5]/40 bg-gradient-to-r from-[#14B8A6]/25 via-[#14B8A6]/35 to-[#14B8A6]/25 font-black text-sm text-[#14F5D5] shadow-lg shadow-[#14B8A6]/15 hover:bg-[#14B8A6] hover:text-[#0B0F19] hover:border-[#14B8A6] active:scale-[0.99] disabled:opacity-40 transition-all cursor-pointer"
      >
        {isSendingReset ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin text-current" />
            <span>{t.sendingLink}</span>
          </>
        ) : (
          <>
            <Send className="h-4.5 w-4.5 text-current" />
            <span>{t.sendResetButton}</span>
          </>
        )}
      </Button>
    </div>
  );
}

