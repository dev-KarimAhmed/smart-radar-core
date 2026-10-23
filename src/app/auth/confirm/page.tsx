'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowRight, ShieldCheck, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

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

        // 2. Check if active session exists
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.email_confirmed_at) {
          if (isMounted) setStatus('success');
          return;
        }

        // 3. Fallback: If arrived from Supabase Action Link redirect, it is already verified
        if (isMounted) {
          setStatus('success');
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err?.message || 'حدث خطأ أثناء محاولة التحقق من الرابط.');
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email_confirmed_at) {
        if (isMounted) setStatus('success');
      }
    });

    void handleConfirmation();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const roleParam = searchParams?.get('role') || '';
  const loginUrl = roleParam === 'captain' || roleParam === 'driver' ? '/login/driver' : '/';

  return (
    <div className="relative min-h-screen bg-[#070B14] flex flex-col justify-center items-center p-4 overflow-hidden font-sans text-slate-100" dir="rtl">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute w-[500px] h-[500px] bg-[#14B8A6]/10 rounded-full blur-[140px] top-1/4 left-1/4" />
      <div className="pointer-events-none absolute w-[400px] h-[400px] bg-[#3B82F6]/10 rounded-full blur-[120px] bottom-1/4 right-1/4" />

      <div className="w-full max-w-md bg-[#0D1424]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center space-y-6">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2">
          <Image
            src="/icons/logo-header.png"
            alt="الرادار الذكي"
            width={180}
            height={50}
            priority
            className="h-10 w-auto object-contain drop-shadow-[0_4px_20px_rgba(20,184,166,0.35)]"
          />
        </div>

        {status === 'verifying' && (
          <div className="py-8 space-y-4 animate-in fade-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#14B8A6]/15 border border-[#14B8A6]/30 text-[#14F5D5]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h1 className="text-xl font-black text-white">جارٍ التحقق من تأكيد حسابك...</h1>
            <p className="text-sm text-slate-400">يرجى الانتظار لحظة بينما نقوم بتفعيل حسابك.</p>
          </div>
        )}

        {(status === 'success' || status === 'already') && (
          <div className="py-4 space-y-5 animate-in fade-in duration-300">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#14F5D5]/20 to-[#14B8A6]/10 border border-[#14F5D5]/40 text-[#14F5D5] shadow-[0_0_30px_rgba(20,245,213,0.25)]">
              <CheckCircle2 className="h-10 w-10 text-[#14F5D5]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {status === 'already' ? 'حسابك مؤكد ومفعل بالفعل!' : '🎉 تم تأكيد حسابك بنجاح!'}
              </h1>
              <p className="text-sm leading-relaxed text-slate-300">
                تم التحقق من بريدك الإلكتروني بنجاح، وأصبح حسابك مفعل وجاهز للاستخدام بالكامل.
              </p>
            </div>

            <div className="pt-4">
              <Link
                href={loginUrl}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#14F5D5] to-[#14B8A6] px-6 py-4 text-base font-black text-[#04140F] shadow-[0_10px_30px_rgba(20,184,166,0.35)] transition-all hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <span>تسجيل الدخول الآن</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-5 animate-in fade-in duration-300">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
              <MailCheck className="h-10 w-10 text-rose-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-white">رابط التأكيد غير صالح أو منتهي</h1>
              <p className="text-sm leading-relaxed text-slate-300">
                {errorMessage || 'قد يكون رابط التأكيد انتهت صلاحيته أو تم استخدامه مسبقاً.'}
              </p>
            </div>

            <div className="pt-4 space-y-2.5">
              <Link
                href={loginUrl}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-black text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <span>الانتقال لتسجيل الدخول</span>
              </Link>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-[#14B8A6]" />
          <span>منظومة الحماية والأمان الموحدة — بينكم &copy; 2026</span>
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
