'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';
import { getClientAccessToken, getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import { formatContractDate, type ContractViewData } from './parts/contract-types';
import { ContractActionBar } from './parts/contract-action-bar';
import { ContractIdentitySection } from './parts/contract-identity-section';
import { ContractClausesSection } from './parts/contract-clauses-section';
import { ContractSealSection } from './parts/contract-seal-section';

export type { ContractViewData } from './parts/contract-types';
export { formatContractDate } from './parts/contract-types';

function ContractContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isArabic } = useDashboardLanguage();
  const captainIdParam = searchParams.get('captainId') || '';
  const autoPrint = searchParams.get('autoprint') === 'true';

  const [data, setData] = useState<ContractViewData | null>(null);
  const [errorCode, setErrorCode] = useState<'' | 'auth' | 'forbidden' | 'not_found' | 'fetch_failed'>('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!data?.captainId) return;
    try {
      setDownloading(true);
      const accessToken = (await getClientAccessToken()) || undefined;
      const downloadUrl = `/api/captain/contract?captainId=${encodeURIComponent(data.captainId)}&download=true&_t=${Date.now()}`;
      const filename = `Bynkcom_Captain_Contract_${data.captainId.slice(0, 8).toUpperCase()}.pdf`;
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
        if (captainIdParam) {
          query.set('captainId', captainIdParam);
        }

        const authHeaders = await getSupabaseAuthHeaders();
        const res = await fetch(`/api/captain/contract?${query.toString()}`, {
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

        const c = payload.contract as ContractViewData;
        setData({
          ...c,
          acceptedAtRaw: c.acceptedAt,
          acceptedAt: c.acceptedAt,
        });
      } catch (err) {
        console.error('Error loading contract data:', err);
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
  }, [captainIdParam]);

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
            {isArabic ? 'جاري استخراج بيانات الوثيقة المعتمدة...' : 'Loading certified contract document...'}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    const errorMsg =
      errorCode === 'auth'
        ? isArabic
          ? 'يرجى تسجيل الدخول أولاً لعرض وثيقة العقد المعتمدة.'
          : 'Please sign in first to view the certified contract document.'
        : errorCode === 'forbidden'
        ? isArabic
          ? 'غير مصرح لك بالاطلاع على عقد كابتن آخر.'
          : 'You are not authorized to view another captain contract.'
        : errorCode === 'fetch_failed'
        ? isArabic
          ? 'تعذر تحميل وثيقة العقد، يرجى المحاولة مجدداً.'
          : 'Failed to load contract document. Please try again.'
        : isArabic
        ? 'لم يتم العثور على سجل العقد للكابتن المطلوب'
        : 'Contract record was not found for the requested captain.';

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070B14] text-slate-100 p-4" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-slate-900/90 p-6 text-center space-y-4">
          <p className="text-base font-bold text-red-400">{errorMsg}</p>
          <Button onClick={() => router.push('/captain')} className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
            {isArabic ? 'العودة للملف الشخصي' : 'Back to Profile'}
          </Button>
        </div>
      </div>
    );
  }

  const docSerial = `BYNK-CAP-${data.captainId.slice(0, 8).toUpperCase()}`;
  const formattedAcceptedAt = formatContractDate(data.acceptedAtRaw ?? data.acceptedAt, isArabic);
  const fullNameDisplay = data.fullName === 'كابتن معلن' && !isArabic ? 'Advertising Captain' : data.fullName;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 selection:bg-teal-500/30 print:bg-white print:text-black" dir={isArabic ? 'rtl' : 'ltr'}>
      <ContractActionBar
        isArabic={isArabic}
        onBack={() => router.push('/captain')}
        onDownloadPdf={() => void handleDownloadPdf()}
        downloading={downloading}
        onPrint={() => window.print()}
      />

      <main className="max-w-4xl mx-auto p-4 sm:p-8 print:p-0 print:max-w-none">
        <article className="relative overflow-hidden rounded-3xl border border-teal-500/40 bg-[#0B0F19] p-6 sm:p-10 shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black">
          <div className="pointer-events-none absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#14F5D5] to-transparent print:hidden" />

          <header className="border-b border-teal-500/25 pb-6 mb-6 print:border-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-black print:text-black print:border-black">
                  <ShieldCheck className="h-4 w-4 text-[#14F5D5] print:text-black" />
                  {isArabic
                    ? 'وثيقة رسمية معتمدة · قانون المعاملات الإلكترونية'
                    : 'Certified Official Document · Electronic Transactions Law'}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white print:text-black tracking-tight mt-2">
                  {isArabic ? 'شبكة بينكم للإعلان الرقمي' : 'Bynkcom Digital Advertising Network'}
                </h1>
                <p className="text-sm font-bold text-teal-300 print:text-gray-700">
                  {isArabic
                    ? `وثيقة عقد اشتراك الكابتن المعلن - النسخة النهائية الموحدة ${data.version}`
                    : `Unified Advertising Captain Subscription Contract - Final Version ${data.version}`}
                </p>
              </div>

              <div className="flex flex-col sm:items-end justify-center rounded-2xl bg-white/5 border border-white/10 p-3.5 print:border-black print:bg-gray-100">
                <p className="text-[11px] font-semibold text-slate-400 print:text-gray-600">
                  {isArabic ? 'رقم الوثيقة والسجل:' : 'Document & Registry ID:'}
                </p>
                <code className="text-sm font-black text-[#14F5D5] font-mono print:text-black">{docSerial}</code>
                <p className="text-[10px] text-emerald-400 font-bold mt-1 print:text-green-800">
                  {isArabic ? '● معتمد وساري المفعول' : '● Certified & Active'}
                </p>
              </div>
            </div>
          </header>

          <ContractIdentitySection data={data} isArabic={isArabic} fullNameDisplay={fullNameDisplay} />
          <ContractClausesSection isArabic={isArabic} />
          <ContractSealSection
            isArabic={isArabic}
            formattedAcceptedAt={formattedAcceptedAt}
            contractHash={data.contractHash}
          />
        </article>
      </main>
    </div>
  );
}

export default function CaptainContractPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070B14]" />}>
      <ContractContent />
    </Suspense>
  );
}
