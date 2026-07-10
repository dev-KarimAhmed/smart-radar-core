'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import LoginPage from '@/components/auth/login-page';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isRedirecting = !!user && (user.role === 'driver' || user.role === 'rider');

  useEffect(() => {
    if (loading || !user) return;

    if (user.role === 'driver') {
      router.replace('/captain');
    } else if (user.role === 'rider') {
      router.replace('/rider');
    }
  }, [user, loading, router]);

  if (loading || isRedirecting) {
    return (
      <div className="flex h-dvh w-screen select-none flex-col items-center justify-center bg-[#0A0F1D] text-white/90">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 shadow-[0_0_30px_rgba(20,184,166,0.18)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#14B8A6]/25 border-t-[#14B8A6]" />
        </div>
        <div className="mt-5 animate-pulse text-xl font-black tracking-normal">الرادار الذكي</div>
        <div className="mt-2 text-xs font-bold text-[#94A3B8]">جاري التحقق من الجلسة...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // If user role is loaded but not rider/driver, we can show a simple fallback or prompt them:
  return (
    <div className="flex h-dvh w-screen flex-col items-center justify-center bg-[#0A0F1D] text-white p-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-xl font-bold">مرحباً بك {user.name}</h1>
        <p className="text-xs text-gray-400">دور المستخدم الحالي: {user.role}</p>
        <p className="text-xs text-red-400">دور المستخدم هذا غير مسجل في مسارات الرادار الحية.</p>
      </div>
    </div>
  );
}
