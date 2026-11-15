'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { getLandingPageUrl } from '@/lib/constants';
import { ConfirmStatusCard } from './confirm-status-card';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'already' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function handleConfirmation() {
      try {
        const tokenHash = searchParams?.get('token_hash');
        const type = searchParams?.get('type') || 'signup';
        const error = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');

        if (error) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(errorDescription || 'انتهت صلاحية رابط التأكيد أو تم استخدامه بالفعل.');
          }
          return;
        }

        // 1. If token_hash exists, verify directly with Supabase OTP
        if (tokenHash) {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });

          if (verifyErr) {
            // If already verified or token expired
            if (verifyErr.message?.includes('expired') || verifyErr.message?.includes('already')) {
              if (isMounted) setStatus('already');
              return;
            }
            throw verifyErr;
          }
        }

        const dispatchConfirmWelcome = (accessToken?: string | null) => {
          if (!accessToken) return;
          void fetch('/api/auth/confirm-welcome', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }).catch(() => null);
        };

        const markPendingPwaPrompt = () => {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('radar_pending_pwa_install_prompt', 'true');
            } catch {}
          }
        };

        // 2. Check if active session exists
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.email_confirmed_at) {
          markPendingPwaPrompt();
          if (isMounted) setStatus('success');
          dispatchConfirmWelcome(sessionData.session.access_token);
          return;
        }

        // 3. Reject unverified confirmation visits without a valid token or confirmed session
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        if (!tokenHash && !hash.includes('access_token=')) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage('رابط التأكيد غير مكتمل أو انتهت صلاحيته.');
          }
          return;
        }

        if (isMounted) {
          setStatus('error');
          setErrorMessage('تعذر التحقق من صلاحية رابط التفعيل.');
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err?.message || 'حدث خطأ أثناء محاولة التحقق من الرابط.');
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('radar_pending_pwa_install_prompt', 'true');
          } catch {}
        }
        if (isMounted) setStatus('success');
        if (session.access_token) {
          void fetch('/api/auth/confirm-welcome', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }).catch(() => null);
        }
      }
    });

    void handleConfirmation();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const langParam = searchParams?.get('lang');
  const [resolvedLang, setResolvedLang] = useState<'ar' | 'en'>(langParam === 'en' ? 'en' : 'ar');

  useEffect(() => {
    if (langParam === 'en' || langParam === 'ar') {
      setResolvedLang(langParam);
      return;
    }
    try {
      const stored = localStorage.getItem('radar_dashboard_language');
      if (stored === 'en' || stored === 'ar') {
        setResolvedLang(stored);
      }
    } catch {}
  }, [langParam]);

  const isArabic = resolvedLang !== 'en';
  const roleParam = searchParams?.get('role') || '';
  const loginUrl = roleParam === 'captain' || roleParam === 'driver' ? '/login/driver' : '/';

  return (
    <div className="relative min-h-screen bg-[#070B14] flex flex-col justify-center items-center p-4 overflow-hidden font-sans text-slate-100" dir={isArabic ? "rtl" : "ltr"}>
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute w-[500px] h-[500px] bg-[#14B8A6]/10 rounded-full blur-[140px] top-1/4 left-1/4" />
      <div className="pointer-events-none absolute w-[400px] h-[400px] bg-[#3B82F6]/10 rounded-full blur-[120px] bottom-1/4 right-1/4" />

      <div className="w-full max-w-md bg-[#0D1424]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center space-y-6">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2">
          <a
            href={getLandingPageUrl()}
            className="inline-flex items-center cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Image
              src="/icons/logo-header.png"
              alt="بينكم - bynkcom"
              width={180}
              height={50}
              priority
              className="h-10 w-auto object-contain drop-shadow-[0_4px_20px_rgba(20,184,166,0.35)]"
            />
          </a>
        </div>

        <ConfirmStatusCard
          status={status}
          isArabic={isArabic}
          errorMessage={errorMessage}
          loginUrl={loginUrl}
        />

        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-[#14B8A6]" />
          <span>{isArabic ? 'منظومة الحماية والأمان الموحدة — بينكم © 2026' : 'Unified Security & Safety System — Bynkcom © 2026'}</span>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-[#14F5D5]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
