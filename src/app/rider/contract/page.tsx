'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';
import { getClientAccessToken, getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import { formatRiderContractDate, type RiderContractViewData } from './parts/rider-contract-types';
import { RiderContractActionBar } from './parts/rider-contract-action-bar';
import { RiderContractIdentitySection } from './parts/rider-contract-identity-section';
import { RiderContractClausesSection } from './parts/rider-contract-clauses-section';

export type { RiderContractViewData } from './parts/rider-contract-types';
export { formatRiderContractDate } from './parts/rider-contract-types';

function RiderContractContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isArabic } = useDashboardLanguage();
  const userIdParam = searchParams.get('userId') || searchParams.get('riderId') || '';
  const autoPrint = searchParams.get('autoprint') === 'true';

  const [data, setData] = useState<RiderContractViewData | null>(null);
  const [errorCode, setErrorCode] = useState<'' | 'auth' | 'forbidden' | 'not_found' | 'fetch_failed'>('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!data?.userId) return;
    try {
      setDownloading(true);
      const accessToken = (await getClientAccessToken()) || undefined;
      const downloadUrl = `/api/rider/contract?userId=${encodeURIComponent(data.userId)}&download=true&_t=${Date.now()}`;
      const filename = `Bynkcom_User_Privacy_${data.userId.slice(0, 8).toUpperCase()}.pdf`;
      await downloadPdfInWorker({ url: downloadUrl, filename, accessToken });
    } catch (e) {
      console.warn('PDF Worker download error:', e);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const query = new URLSearchParams({ format: 'json' });
        if (userIdParam) {
          query.set('userId', userIdParam);
        }

        const authHeaders = await getSupabaseAuthHeaders();
        const res = await fetch(`/api/rider/contract?${query.toString()}`, {
          method: 'GET',
          headers: authHeaders,
          cache: 'no-store',
        });

        const payload = await res.json().catch(() => null);

        if (!active) return;

        if (!res.ok || !payload?.success || !payload?.contract) {
          if (res.status === 401) {
            setErrorCode('auth');
          } else if (res.status === 403) {
            setErrorCode('forbidden');
          } else {
            setErrorCode('not_found');
          }
          setLoading(false);
          return;
        }

        const c = payload.contract as RiderContractViewData;
        setData({
          ...c,
          acceptedAtRaw: c.acceptedAt,
          acceptedAt: c.acceptedAt,
        });
      } catch (err) {
        console.error('Error loading rider contract data:', err);
        if (active) {
          setErrorCode('fetch_failed');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [userIdParam]);

  useEffect(() => {
    if (autoPrint && data) {
      const t = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [autoPrint, data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070B14] text-slate-100" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500/20 border-t-[#14F5D5]" />
          <p className="text-sm font-bold text-teal-300">
            {isArabic ? 'جاري استخراج بيانات وثيقة الخصوصية المعتمدة...' : 'Loading certified privacy document...'}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    const errorMsg =
      errorCode === 'auth'
        ? isArabic
          ? 'يرجى تسجيل الدخول أولاً لعرض وثيقة سياسة الخصوصية المعتمدة.'
          : 'Please sign in first to view the certified privacy document.'
        : errorCode === 'forbidden'
          ? isArabic
            ? 'غير مصرح لك بالاطلاع على وثيقة مستخدم آخر.'
            : 'You are not authorized to view another user privacy document.'
          : errorCode === 'fetch_failed'
            ? isArabic
              ? 'تعذر تحميل وثيقة الخصوصية، يرجى المحاولة مجدداً.'
              : 'Failed to load privacy document. Please try again.'
            : isArabic
              ? 'لم يتم العثور على سجل الوثيقة للمستخدم المطلوب'
              : 'Privacy document record was not found for the requested user.';

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070B14] text-slate-100 p-4" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-slate-900/90 p-6 text-center space-y-4">
          <p className="text-base font-bold text-red-400">{errorMsg}</p>
          <Button onClick={() => router.push('/')} className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
            {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
          </Button>
        </div>
      </div>
    );
  }

  const formattedAcceptedDate = formatRiderContractDate(data.acceptedAtRaw || data.acceptedAt, isArabic);
  const fullNameDisplay = data.fullName || (isArabic ? 'مستخدم مسجل' : 'Registered User');

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 print:bg-white print:text-black font-sans pb-16" dir={isArabic ? 'rtl' : 'ltr'}>
      <RiderContractActionBar
        isArabic={isArabic}
        onBack={() => router.push('/')}
        onDownloadPdf={handleDownloadPdf}
        downloading={downloading}
        onPrint={() => window.print()}
      />

      <main className="max-w-4xl mx-auto px-4 pt-8 print:p-0">
        <header className="mb-6 rounded-3xl border border-teal-500/20 bg-gradient-to-b from-[#0D1424] to-[#070B14] p-6 text-center shadow-2xl print:border-gray-300 print:bg-white print:shadow-none">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 mb-3 print:border-gray-400 print:bg-transparent">
            <ShieldCheck className="h-4 w-4 text-[#14F5D5] print:text-black" />
            <span className="text-xs font-black text-[#14F5D5] print:text-black">
              {isArabic ? 'وثيقة خصوصية رقمية مصدقة ومحمية نسيجياً' : 'Certified Digital Privacy Agreement'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white print:text-black mb-2">
            {isArabic ? 'سياسة خصوصية المستخدم والإعلانات المركزية والمستقلة' : 'User Privacy Policy & Advertising Agreement'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 print:text-gray-600">
            {isArabic
              ? 'شبكة بينكم للإعلان الرقمي · المملكة الأردنية الهاشمية · مسجلة إلكترونياً'
              : 'Bynkcom Ad-Tech Network · Hashemite Kingdom of Jordan · Electronically Certified'}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400 print:text-gray-700 border-t border-white/5 pt-4 print:border-gray-200">
            <span>
              {isArabic ? 'رقم الاعتماد الرقمي:' : 'Digital Certificate Serial:'}{' '}
              <strong className="text-teal-400 print:text-black">BYNK-USR-{data.userId.slice(0, 8).toUpperCase()}</strong>
            </span>
            <span>·</span>
            <span>
              {isArabic ? 'تاريخ الاعتماد والسريان:' : 'Certified Date:'}{' '}
              <strong className="text-white print:text-black">{formattedAcceptedDate}</strong>
            </span>
            <span>·</span>
            <span className="truncate max-w-[280px]">
              {isArabic ? 'البصمة الرقمية:' : 'Hash:'}{' '}
              <span className="text-xs text-slate-500 print:text-gray-600 font-mono">{data.contractHash.slice(0, 16)}...</span>
            </span>
          </div>
        </header>

        <RiderContractIdentitySection data={data} isArabic={isArabic} fullNameDisplay={fullNameDisplay} />
        <RiderContractClausesSection isArabic={isArabic} />
      </main>
    </div>
  );
}

export default function RiderContractPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#070B14] text-slate-100">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500/20 border-t-[#14F5D5]" />
        </div>
      }
    >
      <RiderContractContent />
    </Suspense>
  );
}
