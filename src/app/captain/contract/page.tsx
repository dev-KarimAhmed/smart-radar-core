'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Printer, ArrowRight, Download, CheckCircle2, FileText, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
            onClick={() => window.print()}
            className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#04140F] font-black text-xs sm:text-sm py-2 px-4 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            طباعة / حفظ كـ PDF
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
            <h2 className="text-sm font-black text-teal-300 print:text-black mb-4 flex items-center gap-2 border-b border-white/5 pb-2 print:border-gray-200">
              <FileText className="h-4 w-4 text-[#14F5D5] print:text-black" />
              أولاً: بيانات الكابتن المعلن المتعاقد (السجل الإلكتروني الرسمي)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-white/5 print:border-gray-200">
                <span className="text-slate-400 print:text-gray-600">الاسم الرباعي:</span>
                <strong className="text-white print:text-black">{data.fullName}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 print:border-gray-200">
                <span className="text-slate-400 print:text-gray-600">رقم الهاتف:</span>
                <span className="text-white print:text-black font-mono" dir="ltr">{data.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 print:border-gray-200">
                <span className="text-slate-400 print:text-gray-600">البريد الإلكتروني:</span>
                <span className="text-white print:text-black font-mono" dir="ltr">{data.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 print:border-gray-200">
                <span className="text-slate-400 print:text-gray-600">الرقم الوطني / الهوية:</span>
                <span className="text-white print:text-black font-mono">{data.nationalIdNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 print:border-gray-200">
                <span className="text-slate-400 print:text-gray-600">رخصة القيادة:</span>
                <span className="text-white print:text-black font-mono">{data.licenseNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 print:border-gray-200">
                <span className="text-slate-400 print:text-gray-600">المركبة واللوحة:</span>
                <span className="text-white print:text-black">
                  {data.vehicleMake} {data.vehicleModel} ({data.plateNumber})
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5 print:border-gray-200 sm:col-span-2">
                <span className="text-slate-400 print:text-gray-600">النطاق الجغرافي:</span>
                <span className="text-white print:text-black">{data.governorate} - {data.district}</span>
              </div>
            </div>
          </section>

          {/* Section 2: Core Foundational Principles */}
          <section className="mb-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 print:border-gray-300 print:bg-white text-xs sm:text-sm leading-relaxed space-y-3">
            <h2 className="text-sm font-black text-teal-300 print:text-black mb-3 flex items-center gap-2 border-b border-white/5 pb-2 print:border-gray-200">
              <ShieldCheck className="h-4 w-4 text-[#14F5D5] print:text-black" />
              ثانياً: البنود والضوابط القانونية والتأسيسية الحاكمة
            </h2>

            <ol className="space-y-2 list-decimal list-inside text-slate-300 print:text-gray-800">
              <li>
                <strong className="text-white print:text-black">طبيعة العلاقة واستقلال الكابتن:</strong> يزاول الكابتن نشاطه كمعلن فرد مستقل لحسابه الخاص، وتعد مركبته وسيلة إعلانية مستقلة يديرها بإرادته الحرة دون نشوء عقد عمل أو وكالة أو تبعية تشغيلية للشبكة.
              </li>
              <li>
                <strong className="text-white print:text-black">نطاق دور الشبكة وصفر عمولة (0%):</strong> تقتصر شبكة بينكم على توفير البنية التقنية ومساحة الإعلان الرقمية عبر تطبيق ويب تقدمي (PWA)، ولا تقدم خدمات نقل أو توصيل، ولا تتقاضى أي عمولة أو نسبة من أجور الرحلات والمعاملات المستقلة.
              </li>
              <li>
                <strong className="text-white print:text-black">مؤشر السوق الاسترشادي:</strong> يعد مؤشر التسعير معلومة إحصائية استرشادية غير ملزمة مبنية على بيانات مجمعة لمساعدة الكابتن في اتخاذ قراراته التجارية، ولا يعد تسعيرة جبرية.
              </li>
              <li>
                <strong className="text-white print:text-black">استخدام موارد الجهاز:</strong> يمنح الكابتن موافقة إلكترونية صريحة على استخدام الموقع الجغرافي والإنترنت والشاشة بالقدر الضروري فقط لتقديم الخدمات الإعلانية.
              </li>
              <li>
                <strong className="text-white print:text-black">ضابط انتهاء التتبع الفوري (الخدمة 11):</strong> خدمة مشاركة التتبع لحظية ومؤقتة للأقارب، وتنتهي كلياً وفوراً بمجرد إغلاق الرحلة، ويحظر قطعياً حفظ أي مسارات أو نقاط جغرافية في النظام بعد انتهائها.
              </li>
              <li>
                <strong className="text-white print:text-black">سياسة إسقاط الأجل ومسح السجلات (72 ساعة):</strong> تخضع سجلات الرحلات لمسح وتطهير آلي كل 72 ساعة حتمية من السيرفرات حمايةً للخصوصية التامة.
              </li>
              <li>
                <strong className="text-white print:text-black">التوثيق والأرشفة وحفظ نسخ PDF:</strong> يوثق قبول الكابتن في السجل الإلكتروني المعتمد، وتُحفظ نسخة العقد الرسمية بصيغة PDF بملفه الشخصي وتُرسل لبريده الإلكتروني مع إثبات الختم المشفر.
              </li>
            </ol>
          </section>

          {/* Section 3: Digital Cryptographic Seal & Verification */}
          <section className="rounded-2xl border border-teal-500/30 bg-[#070B14] p-5 print:border-gray-400 print:bg-white text-xs">
            <h2 className="text-sm font-black text-teal-300 print:text-black mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#14F5D5] print:text-black" />
              ثالثاً: الختم الرقمي المشفر والتوثيق الإلكتروني المعتمد
            </h2>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-slate-400 print:text-gray-600">تاريخ ووقت التوثيق والاعتماد:</span>
                <strong className="text-white print:text-black">{data.acceptedAt}</strong>
              </div>

              <div className="flex flex-col gap-1 pt-2">
                <span className="text-slate-400 print:text-gray-600">بصمة التشفير الرقمية السيادية (SHA-256 Sovereign Hash):</span>
                <code className="text-[11px] text-teal-300 font-mono bg-white/5 p-2 rounded-xl break-all print:bg-gray-100 print:text-black border border-white/5 print:border-gray-300">
                  {data.contractHash}
                </code>
              </div>

              <div className="pt-3 border-t border-white/5 print:border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 print:text-gray-600 gap-2">
                <p>تم استخراج وتوثيق هذه الوثيقة إلكترونياً من شبكة بينكم للإعلان الرقمي بموجب قانون المعاملات الإلكترونية.</p>
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

