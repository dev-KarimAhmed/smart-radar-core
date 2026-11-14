import React from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  signInRiderWithPhone,
  verifyEmailOtpCode,
  normalizeInternationalPhone,
} from '@/features/auth/contract';
import { navigateAuth } from '@/lib/auth-routing';
import type { CaptainPersonalValues } from './captain-personal-step';

interface UseCaptainActivationOtpProps {
  personal: CaptainPersonalValues;
  rememberMe: boolean;
  isArabic: boolean;
}

export function useCaptainActivationOtp({
  personal,
  rememberMe,
  isArabic,
}: UseCaptainActivationOtpProps) {
  const { toast } = useToast();
  const [confirmedEmail, setConfirmedEmail] = React.useState<string | null>(null);
  const [captainOtpInput, setCaptainOtpInput] = React.useState('');
  const [isVerifyingCaptainOtp, setIsVerifyingCaptainOtp] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState<number>(0);
  const [isResending, setIsResending] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => setResendCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const submittedCaptainOtpRef = React.useRef<string | null>(null);

  const handleVerifyCaptainOtp = React.useCallback(
    async (codeOverride?: string) => {
      const cleanCode = (codeOverride ?? captainOtpInput).trim().replace(/\D/g, '');
      if (cleanCode.length !== 6 || isVerifyingCaptainOtp) return;
      if (submittedCaptainOtpRef.current === cleanCode) return;
      submittedCaptainOtpRef.current = cleanCode;
      setIsVerifyingCaptainOtp(true);
      try {
        const verifyRes = await verifyEmailOtpCode({
          code: cleanCode,
          email: confirmedEmail || personal.email.trim(),
          phone: personal.phone,
        });
        toast({
          title: isArabic ? 'تم تأكيد الحساب بنجاح! 🎉' : 'Account activated successfully! 🎉',
          description: isArabic
            ? 'تم تفعيل بريدك الإلكتروني بنجاح، جاري الدخول...'
            : 'Your email has been confirmed successfully. Signing in...',
        });
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('radar_pending_pwa_install_prompt', 'true');
          }
          const captainPhone = normalizeInternationalPhone(verifyRes.phone || personal.phone);
          await signInRiderWithPhone({
            phone: captainPhone,
            password: personal.password,
            rememberMe,
            expectedRole: 'CAPTAIN',
            email: confirmedEmail || personal.email.trim(),
          });
          window.location.replace('/captain');
          return;
        } catch (loginErr) {
          console.warn('[Captain auto-login after OTP]', loginErr);
        }
        navigateAuth('login', 'driver');
      } catch (err: any) {
        submittedCaptainOtpRef.current = null;
        toast({
          variant: 'destructive',
          title: isArabic ? 'فشل تأكيد الكود' : 'Verification failed',
          description:
            err?.message || (isArabic ? 'كود التفعيل غير صحيح أو انتهت صلاحيته.' : 'Invalid or expired code.'),
        });
      } finally {
        setIsVerifyingCaptainOtp(false);
      }
    },
    [captainOtpInput, isVerifyingCaptainOtp, confirmedEmail, personal, rememberMe, isArabic, toast],
  );

  React.useEffect(() => {
    const cleanCode = captainOtpInput.trim().replace(/\D/g, '');
    if (cleanCode.length === 6 && !isVerifyingCaptainOtp && submittedCaptainOtpRef.current !== cleanCode) {
      void handleVerifyCaptainOtp(cleanCode);
    } else if (cleanCode.length < 6) {
      submittedCaptainOtpRef.current = null;
    }
  }, [captainOtpInput, isVerifyingCaptainOtp, handleVerifyCaptainOtp]);

  const handleResendConfirmation = async () => {
    if (resendCountdown > 0 || isResending) return;
    const emailToResend = confirmedEmail || personal.email?.trim();
    if (!emailToResend) return;
    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToResend,
          phone: personal.phone,
          lang: isArabic ? 'ar' : 'en',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'تعذر إعادة إرسال رسالة التأكيد.');
      }
      toast({
        title: isArabic ? 'تم الإرسال بنجاح ✉️' : 'Sent successfully ✉️',
        description: data.message || (isArabic ? 'تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.' : 'New confirmation link sent to your email.'),
      });
      setResendCountdown(60);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ أثناء الإرسال' : 'Dispatch error',
        description: err?.message || (isArabic ? 'تعذر إعادة إرسال رسالة التأكيد.' : 'Failed to resend email.'),
      });
    } finally {
      setIsResending(false);
    }
  };

  return {
    confirmedEmail,
    setConfirmedEmail,
    captainOtpInput,
    setCaptainOtpInput,
    isVerifyingCaptainOtp,
    resendCountdown,
    isResending,
    handleVerifyCaptainOtp,
    handleResendConfirmation,
  };
}
