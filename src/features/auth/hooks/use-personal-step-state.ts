'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRegistration } from './use-registration';
import { requestPasswordRecovery } from '../services/password-recovery';
import { normalizePhoneForCountry } from '../utils/registration-helpers';
import { navigateAuth } from '@/lib/auth-routing';
import {
  type Lang,
  type AuthMode,
  authCopy,
  authRoleLabels,
} from '../components/steps/personal-step.copy';

export function usePersonalStepState() {
  const tAuto = useTranslations('auto');
  const reg = useRegistration();

  const [otpInput, setOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState(reg.personal.phone);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const phoneValidation = useMemo(() => {
    return normalizePhoneForCountry(reg.personal.phone, reg.selectedCountry, tAuto);
  }, [reg.personal.phone, reg.selectedCountry, tAuto]);
  const isPhoneValid = phoneValidation.ok;

  const resetPhoneValidation = useMemo(() => {
    return normalizePhoneForCountry(resetPhone, reg.selectedCountry, tAuto);
  }, [resetPhone, reg.selectedCountry, tAuto]);
  const isResetPhoneValid = resetPhoneValidation.ok;

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => setResendCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const submittedOtpRef = useRef<string | null>(null);

  const handleVerifyOtp = useCallback(async (codeToVerify?: string) => {
    const cleanCode = (codeToVerify ?? otpInput).trim().replace(/\D/g, '');
    if (cleanCode.length !== 6 || isVerifyingOtp) return;
    if (submittedOtpRef.current === cleanCode) return;
    submittedOtpRef.current = cleanCode;
    setIsVerifyingOtp(true);
    try {
      const ok = await reg.verifyEmailCode(cleanCode);
      if (!ok) submittedOtpRef.current = null;
    } catch {
      submittedOtpRef.current = null;
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [otpInput, isVerifyingOtp, reg]);

  useEffect(() => {
    const cleanCode = otpInput.trim().replace(/\D/g, '');
    if (cleanCode.length === 6 && !isVerifyingOtp && submittedOtpRef.current !== cleanCode) {
      void handleVerifyOtp(cleanCode);
    } else if (cleanCode.length < 6) {
      submittedOtpRef.current = null;
    }
  }, [otpInput, isVerifyingOtp, handleVerifyOtp]);

  const handleResendConfirmation = async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    try {
      const success = await reg.resendConfirmationEmail(reg.awaitingConfirmationEmail || undefined);
      if (success) setResendCountdown(60);
    } finally {
      setIsResending(false);
    }
  };

  const currentLang = reg.lang as Lang;
  const mode = reg.authMode as AuthMode;
  const isArabic = currentLang === 'ar';
  const t = authCopy[currentLang];
  const roleName = reg.role ? authRoleLabels[reg.role]?.[currentLang] : authRoleLabels.rider[currentLang];
  const tickerItems = useMemo(() => [...t.ticker, ...t.ticker, ...t.ticker], [t.ticker]);

  const submitPasswordRecovery = async () => {
    const cleanPhone = resetPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setResetError(isArabic ? 'يرجى إدخال رقم هاتف صحيح (8 أرقام على الأقل).' : 'Please enter a valid phone number (at least 8 digits).');
      return;
    }
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setResetError(isArabic ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
      return;
    }

    setResetSubmitting(true);
    setResetError('');
    setResetMessage('');
    try {
      const res = await requestPasswordRecovery(resetPhone, resetEmail);
      setResetMessage(res.message);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : tAuto('key_ae0a0345'));
    } finally {
      setResetSubmitting(false);
    }
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (mode === 'register') {
      const cleanEmail = reg.personal.email?.trim() || '';
      if (!cleanEmail) {
        setEmailError(isArabic ? 'البريد الإلكتروني مطلوب لتفعيل الحساب' : 'Email is required for verification');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setEmailError(isArabic ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Invalid email format');
        return;
      }
      const isValid = await reg.validateBeforeAccuracyConfirm();
      if (!isValid) return;
      setShowAccuracyModal(true);
      return;
    }
    reg.handlePersonalSubmit(e);
  };

  const handleConfirmAccuracy = () => {
    setShowAccuracyModal(false);
    reg.handlePersonalSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const openPasswordReset = () => {
    setResetPhone(reg.personal.phone);
    setResetEmail('');
    setResetMessage('');
    setResetError('');
    setResetOpen(true);
  };

  const goToMode = (nextMode: AuthMode) => {
    reg.setAuthMode(nextMode);
    navigateAuth(nextMode, reg.role);
  };

  return {
    ...reg,
    currentLang,
    mode,
    isArabic,
    t,
    roleName,
    tickerItems,
    otpInput,
    setOtpInput,
    isVerifyingOtp,
    showPassword,
    setShowPassword,
    showAccuracyModal,
    setShowAccuracyModal,
    resetOpen,
    setResetOpen,
    resetPhone,
    setResetPhone,
    resetEmail,
    setResetEmail,
    resetSubmitting,
    resetMessage,
    resetError,
    emailError,
    setEmailError,
    resendCountdown,
    isResending,
    phoneValidation,
    isPhoneValid,
    resetPhoneValidation,
    isResetPhoneValid,
    handleVerifyOtp,
    handleResendConfirmation,
    submitPasswordRecovery,
    onFormSubmit,
    handleConfirmAccuracy,
    openPasswordReset,
    goToMode,
  };
}
