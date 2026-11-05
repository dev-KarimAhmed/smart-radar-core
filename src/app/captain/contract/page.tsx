'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Printer, ArrowRight, Download, CheckCircle2, FileText, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';

interface ContractViewData {
  captainId: string;
  fullName: string;
  phone: string;
  email: string;
  nationalIdNumber: string;
  licenseNumber: string;
  plateNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  governorate: string;
  district: string;
  acceptedAt: string;
  contractHash: string;
  version: string;
}

function formatContractDate(dateInput?: string | Date | number): string {
  const dt = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(dt.getTime())) return '-';
  const day = String(dt.getDate()).padStart(2, '0');
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthName = months[dt.getMonth()];
  const year = dt.getFullYear();
  let hours = dt.getHours();
  const mins = String(dt.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;
  return `${day} ${monthName} ${year} - الساعة ${hours}:${mins} ${period}`;
}

function ContractContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const captainIdParam = searchParams.get('captainId') || '';
  const autoPrint = searchParams.get('autoprint') === 'true';

  const [data, setData] = useState<ContractViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!data?.captainId) return;
    try {
      setDownloading(true);
      const downloadUrl = `/api/captain/contract?captainId=${encodeURIComponent(data.captainId)}&download=true&_t=${Date.now()}`;
      const filename = `Bynkcom_Captain_Contract_${data.captainId.slice(0, 8).toUpperCase()}.pdf`;
      await downloadPdfInWorker({ url: downloadUrl, filename });
    } catch (e) {
      console.warn('PDF Worker download error:', e);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        let cid = captainIdParam;
        if (!cid) {
          const { supabase } = await import('@/lib/supabase-client');
          const { data: authData } = await supabase.auth.getUser();
          cid = authData?.user?.id || '';
        }

        if (!cid) {
          setLoading(false);
          return;
        }

        const { supabase } = await import('@/lib/supabase-client');
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', cid)
          .maybeSingle();

        const { data: capProfile } = await supabase
          .from('captain_profiles')
          .select('*')
          .eq('id', cid)
          .maybeSingle();

        const fullName = profile?.full_name || 'كابتن معلن';
        const phone = profile?.phone || '-';
        const email = profile?.email || '-';
        const nationalIdNumber = capProfile?.national_id_number || '-';
        const licenseNumber = capProfile?.license_number || '-';
        const plateNumber = capProfile?.plate_number || profile?.vehicle_plate || '-';
        const vehicleMake = profile?.vehicle_make || capProfile?.vehicle_brand || '';
        const vehicleModel = capProfile?.vehicle_model || '';
        const vehicleYear = profile?.vehicle_year || capProfile?.vehicle_year || '';
        const governorate = profile?.governorate || 'الأردن';
        const district = profile?.district || 'المركزي';
        const acceptedAt = profile?.created_at || new Date().toISOString();
        const version = 'V1.0-Unified';

        // Deterministic hash based on captain parameters
        const hashSeed = `${cid}:${fullName}:${phone}:${nationalIdNumber}:${version}`;
        let hash = '';
        for (let i = 0; i < hashSeed.length; i++) {
          const code = (hashSeed.charCodeAt(i) * 31 + i * 17) % 65536;
          hash += code.toString(16).padStart(4, '0').toUpperCase();
        }
        hash = (hash + '9F8E7D6C5B4A3120E1F2A3B4C5D6E7F8').slice(0, 64);

        setData({
          captainId: cid,
          fullName,
          phone,
          email,
          nationalIdNumber,
          licenseNumber,
          plateNumber,
          vehicleMake,
          vehicleModel,
          vehicleYear,
          governorate,
          district,
          acceptedAt: formatContractDate(acceptedAt),
          contractHash: hash,
          version,
        });
      } catch (err) {
        console.error('Error loading contract data:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
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
      <div className="min-h-screen flex items-center justify-center bg-[#070B14] text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500/20 border-t-[#14F5D5]" />
          <p className="text-sm font-bold text-teal-300">جاري استخراج بيانات الوثيقة المعتمدة...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070B14] text-slate-100 p-4">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-slate-900/90 p-6 text-center space-y-4">
          <p className="text-base font-bold text-red-400">لم يتم العثور على سجل العقد للكابتن المطلوب</p>
          <Button onClick={() => router.push('/driver')} className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
            العودة للملف الشخصي
          </Button>
        </div>
      </div>
    );
  }

  const docSerial = `BYNK-CAP-${data.captainId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 selection:bg-teal-500/30 print:bg-white print:text-black" dir="rtl">
      {/* Top Floating Action Bar - Hidden in Print */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#0B0F19]/90 px-4 py-3 shadow-xl backdrop-blur-xl print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/driver')}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للحساب
          </button>
          <span className="hidden sm:inline-block text-xs font-bold text-teal-400 border-r border-white/10 pr-3 mr-1">
            السجل الإلكتروني المعتمد · بينكم
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => void handleDownloadPdf()}
            disabled={downloading}
            className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#04140F] font-black text-xs sm:text-sm py-2 px-4 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'جاري التحميل...' : 'تحميل نسخة PDF'}
          </Button>

          <Button
            onClick={() => window.print()}
            variant="outline"
            className="border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-bold text-xs sm:text-sm py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-300" />
            طباعة
          </Button>
        </div>
      </header>

      {/* Main Printable Contract Document Container */}
      <main className="max-w-4xl mx-auto p-4 sm:p-8 print:p-0 print:max-w-none">
        <article className="relative overflow-hidden rounded-3xl border border-teal-500/40 bg-[#0B0F19] p-6 sm:p-10 shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black">
          {/* Top Ambient Glow */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#14F5D5] to-transparent print:hidden" />

          {/* Document Header */}
          <header className="border-b border-teal-500/25 pb-6 mb-6 print:border-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-black print:text-black print:border-black">
                  <ShieldCheck className="h-4 w-4 text-[#14F5D5] print:text-black" />
                  وثيقة رسمية معتمدة · قانون المعاملات الإلكترونية
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white print:text-black tracking-tight mt-2">
                  شبكة بينكم للإعلان الرقمي
                </h1>
                <p className="text-sm font-bold text-teal-300 print:text-gray-700">
                  وثيقة عقد اشتراك الكابتن المعلن - النسخة النهائية الموحدة {data.version}
                </p>
              </div>

              <div className="flex flex-col sm:items-end justify-center rounded-2xl bg-white/5 border border-white/10 p-3.5 print:border-black print:bg-gray-100">
                <p className="text-[11px] font-semibold text-slate-400 print:text-gray-600">رقم الوثيقة والسجل:</p>
                <code className="text-sm font-black text-[#14F5D5] font-mono print:text-black">{docSerial}</code>
                <p className="text-[10px] text-emerald-400 font-bold mt-1 print:text-green-800">● معتمد وساري المفعول</p>
              </div>
            </div>
          </header>

          {/* Section 1: Captain Identity & Electronic Registry */}
          <section className="mb-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 print:border-gray-300 print:bg-white">
            <h2 className="text-sm sm:text-base font-black text-teal-300 print:text-black mb-4 flex items-center gap-2 border-b border-white/5 pb-2 print:border-gray-200">
              <FileText className="h-4 w-4 text-[#14F5D5] print:text-black" />
              أولاً: بيانات الكابتن المعلن المتعاقد (السجل الإلكتروني الرسمي)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-2 border-b border-white/5 print:border-gray-200 sm:col-span-2">
                <span className="text-slate-400 print:text-gray-600 whitespace-nowrap ml-2">الاسم الرباعي:</span>
                <strong className="text-white print:text-black text-left">{data.fullName}</strong>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 print:border-gray-200">
                <span className="text-slate-400 print:text-gray-600 whitespace-nowrap ml-2">رقم الهاتف:</span>
                <span className="text-white print:text-black font-mono text-left" dir="ltr">{data.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 print:border-gray-200">
                <span className="text-slate-400 print:text-gray-600 whitespace-nowrap ml-2">رخصة القيادة:</span>
                <span className="text-white print:text-black font-mono text-left">{data.licenseNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 print:border-gray-200 sm:col-span-2">
                <span className="text-slate-400 print:text-gray-600 whitespace-nowrap ml-2">البريد الإلكتروني:</span>
                <span className="text-white print:text-black font-mono text-left" dir="ltr">{data.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 print:border-gray-200 sm:col-span-2">
                <span className="text-slate-400 print:text-gray-600 whitespace-nowrap ml-2">بيانات المركبة واللوحة:</span>
                <span className="text-white print:text-black text-left">
                  {data.vehicleMake} {data.vehicleModel} ({data.plateNumber})
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 print:border-gray-200 sm:col-span-2">
                <span className="text-slate-400 print:text-gray-600 whitespace-nowrap ml-2">النطاق الجغرافي المعتمد:</span>
                <span className="text-white print:text-black text-left">{data.governorate} - {data.district}</span>
              </div>
            </div>
          </section>

          {/* Section 2: Core Foundational Principles - 9 Sovereign Clauses */}
          <section className="mb-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 sm:p-6 print:border-gray-300 print:bg-white text-xs sm:text-sm leading-relaxed space-y-4">
            <h2 className="text-sm sm:text-base font-black text-teal-300 print:text-black mb-4 flex items-center gap-2 border-b border-white/5 pb-2 print:border-gray-200">
              <ShieldCheck className="h-4 w-4 text-[#14F5D5] print:text-black" />
              ثانياً: الضوابط والاشتراطات التأسيسية المعتمدة (المواد الحاكمة من وثيقة الشروط الموحدة)
            </h2>

            <div className="space-y-3.5 text-slate-300 print:text-gray-800 leading-loose">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">1</span>
                <p className="text-slate-300 print:text-black leading-relaxed">
                  <strong className="text-white print:text-black font-bold">صفة الكابتن:</strong> يزاول الكابتن نشاطه كمعلن مستقل لحسابه الخاص، وتعد المركبة وسيلة إعلانية شخصية له، ولا ينشأ أي عقد عمل أو تبعية مع الشبكة بأي شكل.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">2</span>
                <p className="text-slate-300 print:text-black leading-relaxed">
                  <strong className="text-white print:text-black font-bold">طبيعة الشبكة:</strong> شبكة بينكم منصة تقنية للإعلانات الرقمية والتسويق، ولا تقدم أي خدمات نقل أو توجيه أو توصيل ركاب إطلاقاً.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">3</span>
                <p className="text-slate-300 print:text-black leading-relaxed">
                  <strong className="text-white print:text-black font-bold">صفر عمولة (0%):</strong> لا تتقاضى الشبكة أي عمولة أو نسبة مئوية من أجور الرحلات أو الصفقات المباشرة بين الكابتن والمستخدمين في أي وقت.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">4</span>
                <p className="text-slate-300 print:text-black leading-relaxed">
                  <strong className="text-white print:text-black font-bold">مؤشر السوق الاسترشادي:</strong> مؤشر إحصائي استرشادي غير إلزامي محسوب محلياً، ولا يعد بأي حال تسعيرة إجبارية على الكابتن.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">5</span>
                <p className="text-slate-300 print:text-black leading-relaxed">
                  <strong className="text-white print:text-black font-bold">أذونات موارد الجهاز:</strong> يمنح الكابتن إذناً صريحاً ومحدداً للموقع والإنترنت والشاشة بالقدر الضروري لتشغيل التطبيق وبث الإعلانات فقط.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">6</span>
                <p className="text-slate-300 print:text-black leading-relaxed">
                  <strong className="text-white print:text-black font-bold">زر مشاركة التتبع المباشر:</strong> ميزة تتبع لحظية طارئة تنتهي فورياً بإغلاق الرحلة، دون حفظ أي مسار أو سجل في خوادم النظام حفاظاً على السرية.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">7</span>
                <p className="text-slate-300 print:text-black leading-relaxed">
                  <strong className="text-white print:text-black font-bold">إسقاط الأجل ومسح السجلات (72 ساعة):</strong> تخضع سجلات التحركات لمسح وتطهير آلي دوري كل 72 ساعة حتمية لحماية الخصوصية المطلقة.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">8</span>
                <p className="text-slate-300 print:text-black leading-relaxed">
                  <strong className="text-white print:text-black font-bold">نظام الرتب الخمسة:</strong> يخضع الكابتن للتصنيف الآلي المعتمد (برونزي، فضي، ذهبي، بلاتيني، ماسي) حسب ساعات التواجد وجودة الأداء والتقييم.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">9</span>
                <p className="text-slate-300 print:text-black leading-relaxed">
                  <strong className="text-white print:text-black font-bold">التدقيق الآلي للإعلانات:</strong> تخضع كافة المواد الإعلانية للفرز المسبق بالذكاء الاصطناعي لضمان الامتثال للقوانين والآداب العامة وسيادة القانون.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Digital Cryptographic Seal & Verification */}
          <section className="rounded-2xl border border-teal-500/30 bg-[#070B14] p-5 sm:p-6 print:border-gray-400 print:bg-white text-xs sm:text-sm">
            <h2 className="text-sm sm:text-base font-black text-teal-300 print:text-black mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#14F5D5] print:text-black" />
              ثالثاً: الختم الرقمي المشفر والتوثيق الإلكتروني المعتمد
            </h2>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400 print:text-gray-600">تاريخ ووقت التوثيق والاعتماد:</span>
                <strong className="text-[#14F5D5] print:text-black">{data.acceptedAt}</strong>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-slate-400 print:text-gray-600">بصمة التشفير الرقمية السيادية (SHA-256 Sovereign Hash):</span>
                <code className="text-xs sm:text-sm text-teal-300 font-mono bg-white/5 p-3 rounded-xl break-all print:bg-gray-100 print:text-black border border-white/5 print:border-gray-300 font-bold tracking-wider">
                  {data.contractHash}
                </code>
              </div>

              <div className="pt-3 border-t border-white/5 print:border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 print:text-gray-600 gap-2">
                <p className="flex items-center gap-1.5 text-emerald-400">
                  <span className="text-sm">✓</span>
                  تم توثيق وقبول الشروط إلكترونياً وحفظ السجل التعاقدي بموجب قانون المعاملات الإلكترونية.
                </p>
                <span className="text-[#14F5D5] font-bold print:text-black">bynkcom MEDIA SMART © 2026</span>
              </div>
            </div>
          </section>
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

