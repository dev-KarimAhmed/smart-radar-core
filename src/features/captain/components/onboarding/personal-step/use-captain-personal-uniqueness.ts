'use client';

import React from 'react';

interface UseCaptainPersonalUniquenessParams {
  phone: string;
  email: string;
  tv: (key: string) => string;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function useCaptainPersonalUniqueness({
  phone,
  email,
  tv,
  setErrors,
}: UseCaptainPersonalUniquenessParams) {
  const checkEmailUniqueness = React.useCallback(
    async (emailToTest: string) => {
      const cleanEmail = emailToTest.trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return true;
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const { data: availability, error } = await supabase.rpc('check_captain_identity_available', {
          p_email: cleanEmail,
        });
        if (!error && availability?.email_taken) {
          setErrors((current) => ({
            ...current,
            email: tv('emailDuplicate') || 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر.',
          }));
          return false;
        }
      } catch (err) {
        console.warn('Email uniqueness check error:', err);
      }
      return true;
    },
    [tv, setErrors]
  );

  const checkPhoneUniqueness = React.useCallback(
    async (phoneToTest: string) => {
      const cleanPhone = phoneToTest.trim();
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      if (!cleanPhone || digitsOnly.length < 8) return true;
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const { data: availability, error } = await supabase.rpc('check_captain_identity_available', {
          p_phone: cleanPhone,
        });
        if (!error && availability?.phone_taken) {
          setErrors((current) => ({
            ...current,
            phone: tv('phoneDuplicate') || 'رقم الهاتف مسجل بالفعل مسبقاً لحساب آخر.',
          }));
          return false;
        }
      } catch (err) {
        console.warn('Phone uniqueness check error:', err);
      }
      return true;
    },
    [tv, setErrors]
  );

  React.useEffect(() => {
    const cleanPhone = phone.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || digitsOnly.length < 8) return;

    const timer = setTimeout(() => {
      void checkPhoneUniqueness(cleanPhone);
    }, 400);

    return () => clearTimeout(timer);
  }, [phone, checkPhoneUniqueness]);

  React.useEffect(() => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return;

    const timer = setTimeout(() => {
      void checkEmailUniqueness(cleanEmail);
    }, 400);

    return () => clearTimeout(timer);
  }, [email, checkEmailUniqueness]);

  return {
    checkEmailUniqueness,
    checkPhoneUniqueness,
  };
}
