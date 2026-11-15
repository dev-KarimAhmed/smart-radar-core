import React from 'react';
import { supabase } from '@/lib/supabase-client';

interface UseResetPasswordSessionProps {
  token: string;
  language: string;
  missingMessage: string;
}

export function useResetPasswordSession({
  token,
  language,
  missingMessage,
}: UseResetPasswordSessionProps) {
  const [checkingSession, setCheckingSession] = React.useState(!token);
  const [hasSession, setHasSession] = React.useState(false);
  const [sessionError, setSessionError] = React.useState('');
  const [capturedToken, setCapturedToken] = React.useState('');

  React.useEffect(() => {
    if (token) return;
    let active = true;

    // 0. Immediate check for error in hash (e.g. expired or already used OTP token)
    if (typeof window !== 'undefined' && window.location.hash.includes('error=')) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const errorDesc = hashParams.get('error_description');
      const errorCode = hashParams.get('error_code');
      if (errorCode === 'otp_expired' || errorDesc?.includes('expired') || errorDesc?.includes('invalid')) {
        setSessionError(
          language === 'en'
            ? 'This link has expired or has already been used. Please request a new recovery link from the login screen.'
            : 'هذا الرابط غير صالح أو انتهت صلاحيته (أو تم استخدامه مسبقاً). يرجى طلب رابط استعادة جديد من شاشة الدخول.',
        );
      } else if (errorDesc) {
        setSessionError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      } else {
        setSessionError(missingMessage);
      }
      setCheckingSession(false);
      return;
    }

    // 0.5. Immediate check for access_token in URL hash
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.includes('access_token=')) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken) {
          setCapturedToken(accessToken);
          try {
            window.sessionStorage.setItem('recovery_access_token', accessToken);
            if (refreshToken) window.sessionStorage.setItem('recovery_refresh_token', refreshToken);
          } catch {
            // ignore
          }
          void supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          }).then(({ data, error: setErr }) => {
            if (!active) return;
            if (data.session && !setErr) {
              setHasSession(true);
              setCheckingSession(false);
            }
          });
        }
      } else {
        try {
          const stored = window.sessionStorage.getItem('recovery_access_token');
          if (stored) setCapturedToken(stored);
        } catch {
          // ignore
        }
      }
    }

    // 1. Check for PKCE ?code= in searchParams
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      if (code) {
        void supabase.auth.exchangeCodeForSession(code).then(({ data, error: exErr }) => {
          if (!active) return;
          if (data.session && !exErr) {
            setHasSession(true);
            setCheckingSession(false);
          }
        });
      }
    }

    // 2. Check existing session
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    // 3. Listen to auth state changes (crucial for PASSWORD_RECOVERY event!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED'))) {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    // 4. Fallback timeout to stop spinner after 2.5 seconds if no session arrived
    const timer = setTimeout(() => {
      if (!active) return;
      void supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        setHasSession(Boolean(data.session));
        setCheckingSession(false);
      });
    }, 2500);

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [token, language, missingMessage]);

  const canUseForm =
    Boolean(token) ||
    hasSession ||
    (typeof window !== 'undefined' &&
      (window.location.hash.includes('access_token=') || window.location.search.includes('code=')));

  return {
    checkingSession,
    hasSession,
    sessionError,
    setSessionError,
    capturedToken,
    canUseForm,
  };
}
